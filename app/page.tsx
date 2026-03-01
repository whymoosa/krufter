import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const card = {
  background: '#1e1e22',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
  padding: '22px 24px',
  boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
}

const statusColors: Record<string, string> = {
  paid: '#4ade80', sent: '#fbbf24', overdue: '#f87171', draft: '#5a5a5a'
}

export default async function Dashboard() {
  const { data: invoices } = await supabase.from('invoices').select('*')
  const { data: income } = await supabase.from('income').select('*')
  const { data: expenses } = await supabase.from('expenses').select('*')

  const totalRevenue = income?.reduce((sum, i) => sum + Number(i.amount), 0) ?? 0
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0
  const pendingInvoices = invoices?.filter(i => i.status === 'sent' || i.status === 'overdue') ?? []
  const pendingTotal = pendingInvoices.reduce((sum, i) => sum + Number(i.total), 0)
  const overdueCount = invoices?.filter(i => i.status === 'overdue').length ?? 0
  const netProfit = totalRevenue - totalExpenses

  const stats = [
    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}` },
    { label: 'Total Expenses', value: `$${totalExpenses.toLocaleString()}` },
    { label: 'Net Profit', value: `$${netProfit.toLocaleString()}` },
    { label: 'Pending Invoices', value: `$${pendingTotal.toLocaleString()}` },
  ]

  return (
    <div style={{ maxWidth: 880 }}>

      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px', lineHeight: 1.1 }}>
          Good morning 👋
        </h1>
        <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 8 }}>
          Here's your Krufter overview.
        </p>
      </div>

      {overdueCount > 0 && (
        <div style={{
          background: 'rgba(248,113,113,0.06)',
          border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 10,
          padding: '12px 18px',
          marginBottom: 28,
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 13,
        }}>
          <span>⚠️</span>
          <span style={{ color: '#f87171' }}>
            {overdueCount} overdue invoice{overdueCount > 1 ? 's' : ''} —
          </span>
          <Link href="/invoices" style={{ color: '#1488fc' }}>view now →</Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        {stats.map((s) => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: 11, color: '#4a4a4a', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {s.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.5px' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
        <Link href="/invoices/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px',
          background: '#1488fc',
          borderRadius: 999,
          fontSize: 13, fontWeight: 500, color: '#fff',
          boxShadow: '0 0 20px rgba(20,136,252,0.3)',
        }}>
          ✏️ New Invoice
        </Link>
        <Link href="/finances" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 999,
          fontSize: 13, fontWeight: 500, color: '#8a8a8f',
        }}>
          View Finances →
        </Link>
      </div>

      {invoices && invoices.length > 0 && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Recent Invoices</div>
            <Link href="/invoices" style={{ fontSize: 12, color: '#1488fc' }}>View all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {invoices.slice(0, 5).map((inv: any) => (
              <div key={inv.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '11px 14px', borderRadius: 8,
                background: 'rgba(255,255,255,0.02)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>#{inv.invoice_number}</div>
                  <div style={{ fontSize: 13, color: '#5a5a5a' }}>{inv.client_name}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                    ${Number(inv.total).toLocaleString()}
                  </div>
                  <span style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 999,
                    background: `${statusColors[inv.status] ?? '#5a5a5a'}15`,
                    color: statusColors[inv.status] ?? '#5a5a5a',
                    border: `1px solid ${statusColors[inv.status] ?? '#5a5a5a'}30`,
                    textTransform: 'capitalize',
                  }}>{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}