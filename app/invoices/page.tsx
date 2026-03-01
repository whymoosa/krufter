import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const statusColors: Record<string, string> = {
  paid: '#4ade80', sent: '#fbbf24', overdue: '#f87171', draft: '#5a5a5a'
}

const headers = ['Invoice', 'Client', 'Amount', 'Due Date', 'Status', '']

export default async function InvoicesPage() {
  const { data: invoices } = await supabase
    .from('invoices').select('*').order('created_at', { ascending: false })

  return (
    <div style={{ maxWidth: 880 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>Invoices</h1>
          <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 8 }}>{invoices?.length ?? 0} total</p>
        </div>
        <Link href="/invoices/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px',
          background: '#1488fc',
          borderRadius: 999,
          fontSize: 13, fontWeight: 500, color: '#fff',
          boxShadow: '0 0 20px rgba(20,136,252,0.3)',
        }}>
          New Invoice
        </Link>
      </div>

      {!invoices?.length ? (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          background: '#1e1e22',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>🧾</div>
          <p style={{ fontSize: 16, color: '#5a5a5a', marginBottom: 8 }}>No invoices yet</p>
          <Link href="/invoices/new" style={{ fontSize: 13, color: '#1488fc' }}>
            Create your first one →
          </Link>
        </div>
      ) : (
        <div style={{
          background: '#1e1e22',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr 120px 130px 110px 70px',
            padding: '12px 20px',
            borderBottom: '1px solid #1a1a1a',
            fontSize: 11, color: '#3a3a3a',
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            {headers.map((h, i) => <div key={i}>{h}</div>)}
          </div>

          {invoices.map((inv: any, i: number) => (
            <div key={inv.id} style={{
              display: 'grid',
              gridTemplateColumns: '110px 1fr 120px 130px 110px 70px',
              alignItems: 'center',
              padding: '14px 20px',
              borderBottom: i < invoices.length - 1 ? '1px solid #1a1a1a' : 'none',
            }}>
              <div style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>
                #{inv.invoice_number}
              </div>
              <div style={{ fontSize: 13, color: '#8a8a8f' }}>
                {inv.client_name}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                ${Number(inv.total).toLocaleString()}
              </div>
              <div style={{ fontSize: 13, color: '#5a5a5a' }}>
                {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
              </div>
              <div>
                <span style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 999,
                  background: `${statusColors[inv.status] ?? '#5a5a5a'}15`,
                  color: statusColors[inv.status] ?? '#5a5a5a',
                  border: `1px solid ${statusColors[inv.status] ?? '#5a5a5a'}30`,
                  textTransform: 'capitalize',
                }}>
                  {inv.status}
                </span>
              </div>
              <Link href={`/invoices/${inv.id}`} style={{ fontSize: 13, color: '#1488fc' }}>
                View →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}