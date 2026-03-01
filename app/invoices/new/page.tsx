'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type LineItem = { description: string; quantity: number; rate: number }

const inputStyle = {
  background: '#141416',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#e8e8e8',
  fontSize: 14,
  width: '100%',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s',
}

const label = (text: string) => (
  <div style={{ fontSize: 11, color: '#4a4a4a', marginBottom: 7, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>
    {text}
  </div>
)

export default function NewInvoice() {
  const router = useRouter()
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [taxRate, setTaxRate] = useState(0)
  const [saving, setSaving] = useState(false)
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', quantity: 1, rate: 0 }])

  const updateItem = (i: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems]
    updated[i] = { ...updated[i], [field]: value }
    setLineItems(updated)
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0)
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax

  const save = async (status: 'draft' | 'sent') => {
    if (!clientName) return alert('Please enter a client name')
    setSaving(true)
    const { error } = await supabase.from('invoices').insert({
      invoice_number: Date.now().toString().slice(-6),
      client_name: clientName, client_email: clientEmail,
      line_items: lineItems, subtotal, tax_rate: taxRate, total, status,
      due_date: dueDate || null, notes,
    })
    if (error) { alert('Error: ' + error.message); setSaving(false); return }
    router.push('/invoices')
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>New Invoice</h1>
        <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 8 }}>Fill in the details below.</p>
      </div>

      <div style={{
        background: '#1e1e22',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14,
        padding: 32,
        boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
      }}>
        {/* Client Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
          <div>
            {label('Client Name *')}
            <input style={inputStyle} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Acme Corp" />
          </div>
          <div>
            {label('Client Email')}
            <input style={inputStyle} type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@email.com" />
          </div>
        </div>

        {/* Line Items */}
        <div style={{ marginBottom: 28 }}>
          {label('Line Items')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 40px', gap: 8, marginBottom: 8 }}>
            {['Description', 'Qty', 'Rate ($)', ''].map(h => (
              <div key={h} style={{ fontSize: 11, color: '#3a3a3a', paddingLeft: 4 }}>{h}</div>
            ))}
          </div>
          {lineItems.map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 40px', gap: 8, marginBottom: 8 }}>
              <input style={inputStyle} value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Service description" />
              <input style={inputStyle} type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} min={1} />
              <input style={inputStyle} type="number" value={item.rate} onChange={e => updateItem(i, 'rate', Number(e.target.value))} min={0} />
              <button onClick={() => setLineItems(lineItems.filter((_, idx) => idx !== i))} style={{
                background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: 8, color: '#f87171', cursor: 'pointer', fontSize: 18,
              }}>×</button>
            </div>
          ))}
          <button onClick={() => setLineItems([...lineItems, { description: '', quantity: 1, rate: 0 }])} style={{
            marginTop: 8, padding: '7px 16px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            color: '#5a5a5a', cursor: 'pointer', fontSize: 13,
            fontFamily: 'inherit',
          }}>+ Add line item</button>
        </div>

        {/* Bottom */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>{label('Due Date')}<input style={inputStyle} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
            <div>{label('Tax Rate (%)')}<input style={inputStyle} type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} min={0} max={100} /></div>
            <div>{label('Notes')}<textarea style={{ ...inputStyle, height: 90, resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payment terms, bank details..." /></div>
          </div>

          {/* Totals */}
          <div style={{
            background: '#141416',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: 22,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div>
              {[
                { label: 'Subtotal', value: `$${subtotal.toFixed(2)}` },
                { label: `Tax (${taxRate}%)`, value: `$${tax.toFixed(2)}` },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid #1a1a1a',
                  fontSize: 13,
                }}>
                  <span style={{ color: '#5a5a5a' }}>{row.label}</span>
                  <span style={{ color: '#e8e8e8' }}>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0' }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Total</span>
                <span style={{ fontSize: 26, fontWeight: 700, color: '#1488fc', letterSpacing: '-0.5px' }}>
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => save('sent')} disabled={saving} style={{
                padding: '12px',
                background: '#1488fc',
                border: 'none', borderRadius: 999,
                boxShadow: '0 0 20px rgba(20,136,252,0.3)',
                cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#fff',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}>{saving ? 'Saving...' : '✓ Save & Mark as Sent'}</button>
              <button onClick={() => save('draft')} disabled={saving} style={{
                padding: '11px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 999,
                cursor: 'pointer', fontSize: 13, color: '#5a5a5a',
                fontFamily: 'inherit',
              }}>{saving ? 'Saving...' : 'Save as Draft'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}