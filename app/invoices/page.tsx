import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const statusStyle: Record<string, { color: string; bg: string }> = {
  draft:   { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  sent:    { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  paid:    { color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  overdue: { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
}

export default async function InvoicesPage() {
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Invoices</h1>
          <p style={{ color: '#6b7280', marginTop: 6, fontSize: 14 }}>{invoices?.length ?? 0} total invoices</p>
        </div>
        <Link href="/invoices/new" style={{
          padding: '10px 20px', borderRadius: 10, textDecoration: 'none',
          background: 'linear-gradient(135deg, #22d3ee, #818cf8)',
          color: '#000', fontWeight: 700, fontSize: 14,
        }}>
          ＋ New Invoice
        </Link>
      </div>

      {!invoices?.length ? (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          background: '#0d1220', border: '1px solid #1e2a3a',
          borderRadius: 14, color: '#4b5563',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
          <p style={{ fontSize: 16, marginBottom: 8 }}>No invoices yet</p>
          <Link href="/invoices/new" style={{ color: '#818cf8', fontSize: 14 }}>Create your first invoice →</Link>
        </div>
      ) : (
        <div style={{ background: '#0d1220', border: '1px solid #1e2a3a', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e2a3a' }}>
                {['Invoice #', 'Client', 'Total', 'Due Date', 'Status', 'Action'].map(h => (
                  <th key={h} style={{
                    padding: '14px 20px', textAlign: 'left',
                    fontSize: 11, color: '#4b5563', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => {
                const s = statusStyle[inv.status] ?? statusStyle.draft
                return (
                  <tr key={inv.id} style={{
                    borderBottom: i < invoices.length - 1 ? '1px solid #1e2a3a' : 'none',
                  }}>
                    <td style={{ padding: '14px 20px', fontSize: 14, color: '#e2e8f0', fontWeight: 600 }}>
                      #{inv.invoice_number}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 14, color: '#94a3b8' }}>{inv.client_name}</td>
                    <td style={{ padding: '14px 20px', fontSize: 14, color: '#34d399', fontWeight: 700 }}>
                      ${Number(inv.total).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280' }}>
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        color: s.color, background: s.bg, textTransform: 'capitalize',
                      }}>{inv.status}</span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <Link href={`/invoices/${inv.id}`} style={{ color: '#818cf8', fontSize: 13 }}>View →</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}