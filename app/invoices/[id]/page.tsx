'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  paid: '#4ade80', sent: '#fbbf24', overdue: '#f87171', draft: '#5a5a5a'
}

export default function InvoiceDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => { fetchInvoice() }, [id])

  const fetchInvoice = async () => {
    const { data } = await supabase.from('invoices').select('*').eq('id', id).single()
    setInvoice(data)
    setLoading(false)
  }

  const updateStatus = async (status: string) => {
    setUpdating(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('invoices').update({
      status,
      paid_at: status === 'paid' ? new Date().toISOString() : null,
    }).eq('id', id)

    await supabase.from('activity_log').insert({
      user_id: user?.id,
      action: 'updated_invoice',
      details: `Invoice #${invoice.invoice_number} marked as ${status}`,
    })
    setUpdating(false)
    fetchInvoice()
  }

  const deleteInvoice = async () => {
    if (!confirm('Delete this invoice? This cannot be undone.')) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('invoices').delete().eq('id', id)
    await supabase.from('activity_log').insert({
      user_id: user?.id,
      action: 'deleted_invoice',
      details: `Deleted invoice #${invoice.invoice_number} — $${invoice.total}`,
    })
    router.push('/invoices')
  }

  if (loading) return <div style={{ color: '#5a5a5a', fontSize: 14 }}>Loading...</div>
  if (!invoice) return <div style={{ color: '#5a5a5a', fontSize: 14 }}>Invoice not found</div>

  const lineItems = invoice.line_items ?? []

  return (
    <div style={{ maxWidth: 760 }}>
      <Link href="/invoices" style={{ fontSize: 13, color: '#5a5a5a', marginBottom: 16, display: 'inline-block' }}>
        ← Invoices
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>
            Invoice #{invoice.invoice_number}
          </h1>
          <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 6 }}>
            {invoice.client_name}
            {invoice.due_date ? ` · Due ${new Date(invoice.due_date).toLocaleDateString()}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            fontSize: 12, padding: '4px 14px', borderRadius: 999,
            background: `${statusColors[invoice.status] ?? '#5a5a5a'}15`,
            color: statusColors[invoice.status] ?? '#5a5a5a',
            border: `1px solid ${statusColors[invoice.status] ?? '#5a5a5a'}30`,
            textTransform: 'capitalize',
          }}>{invoice.status}</span>
        </div>
      </div>

      {/* Status actions */}
      <div style={{
        background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12, padding: '18px 22px', marginBottom: 16,
        display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
        boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
      }}>
        <span style={{ fontSize: 13, color: '#5a5a5a', marginRight: 4 }}>Mark as:</span>
        {['draft', 'sent', 'paid', 'overdue'].map(s => (
          <button key={s} onClick={() => updateStatus(s)} disabled={updating || invoice.status === s} style={{
            padding: '7px 16px',
            background: invoice.status === s ? `${statusColors[s]}20` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${invoice.status === s ? statusColors[s] + '40' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 999, cursor: invoice.status === s ? 'default' : 'pointer',
            fontSize: 12, color: invoice.status === s ? statusColors[s] : '#8a8a8f',
            fontFamily: 'inherit', textTransform: 'capitalize',
            opacity: updating ? 0.5 : 1,
          }}>{s}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={deleteInvoice} style={{
          padding: '7px 16px',
          background: 'rgba(248,113,113,0.06)',
          border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 999, cursor: 'pointer',
          fontSize: 12, color: '#f87171', fontFamily: 'inherit',
        }}>Delete Invoice</button>
      </div>

      {/* Invoice body */}
      <div style={{
        background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12, padding: '28px 28px',
        boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
      }}>
        {/* Client info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #1a1a1a' }}>
          <div>
            <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Bill To</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{invoice.client_name}</div>
            {invoice.client_email && <div style={{ fontSize: 13, color: '#5a5a5a' }}>{invoice.client_email}</div>}
          </div>
          <div style={{ textAlign: 'right' as const }}>
            <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Details</div>
            <div style={{ fontSize: 13, color: '#5a5a5a', marginBottom: 4 }}>
              Created: {new Date(invoice.created_at).toLocaleDateString()}
            </div>
            {invoice.due_date && (
              <div style={{ fontSize: 13, color: '#5a5a5a' }}>
                Due: {new Date(invoice.due_date).toLocaleDateString()}
              </div>
            )}
            {invoice.paid_at && (
              <div style={{ fontSize: 13, color: '#4ade80', marginTop: 4 }}>
                Paid: {new Date(invoice.paid_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Line items */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 80px 100px 100px',
            padding: '8px 0', marginBottom: 8,
            fontSize: 11, color: '#3a3a3a',
            textTransform: 'uppercase', letterSpacing: '0.07em',
            borderBottom: '1px solid #1a1a1a',
          }}>
            {['Description', 'Qty', 'Rate', 'Total'].map(h => <div key={h}>{h}</div>)}
          </div>
          {lineItems.map((item: any, i: number) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 80px 100px 100px',
              padding: '12px 0', fontSize: 13,
              borderBottom: '1px solid #141416',
            }}>
              <div style={{ color: '#e8e8e8' }}>{item.description}</div>
              <div style={{ color: '#8a8a8f' }}>{item.quantity}</div>
              <div style={{ color: '#8a8a8f' }}>${Number(item.rate).toLocaleString()}</div>
              <div style={{ color: '#fff', fontWeight: 500 }}>
                ${(item.quantity * item.rate).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 260 }}>
            {[
              { label: 'Subtotal', value: `$${Number(invoice.subtotal).toLocaleString()}` },
              { label: `Tax (${invoice.tax_rate}%)`, value: `$${(invoice.total - invoice.subtotal).toFixed(2)}` },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '9px 0', borderBottom: '1px solid #1a1a1a', fontSize: 13,
              }}>
                <span style={{ color: '#5a5a5a' }}>{row.label}</span>
                <span style={{ color: '#e8e8e8' }}>{row.value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0' }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Total</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#1488fc', letterSpacing: '-0.5px' }}>
                ${Number(invoice.total).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div style={{
            marginTop: 20, padding: '14px 16px',
            background: '#141416', borderRadius: 8,
            borderLeft: '3px solid #2a2a2a',
            fontSize: 13, color: '#6a6a6f', lineHeight: 1.5,
          }}>
            📝 {invoice.notes}
          </div>
        )}
      </div>
    </div>
  )
}