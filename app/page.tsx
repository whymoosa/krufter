import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default async function Dashboard() {
  const { data: invoices } = await supabase.from('invoices').select('*')
  const { data: income } = await supabase.from('income').select('*')
  const { data: expenses } = await supabase.from('expenses').select('*')

  const totalRevenue = income?.reduce((sum, i) => sum + Number(i.amount), 0) ?? 0
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0
  const pendingInvoices = invoices?.filter(i => i.status === 'sent' || i.status === 'overdue') ?? []
  const pendingTotal = pendingInvoices.reduce((sum, i) => sum + Number(i.total), 0)
  const overdueCount = invoices?.filter(i => i.status === 'overdue').length ?? 0

  const stats = [
    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, sub: 'All time income logged', accent: '#22d3ee' },
    { label: 'Total Expenses', value: `$${totalExpenses.toLocaleString()}`, sub: 'All time expenses logged', accent: '#f87171' },
    { label: 'Net Profit', value: `$${(totalRevenue - totalExpenses).toLocaleString()}`, sub: 'Revenue minus expenses', accent: '#34d399' },
    { label: 'Pending Invoices', value: `$${pendingTotal.toLocaleString()}`, sub: `${pendingInvoices.length} invoices unpaid`, accent: '#fbbf24' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#6b7280', marginTop: 6, fontSize: 14 }}>Your Krufter business overview.</p>
      </div>

      {overdueCount > 0 && (
        <div style={{
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)',
          borderRadius: 12, padding: '14px 18px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ color: '#f87171', fontSize: 18 }}>⚠</span>
          <span style={{ color: '#f87171', fontSize: 14, fontWeight: 500 }}>
            You have {overdueCount} overdue invoice{overdueCount > 1 ? 's' : ''} — 
          </span>
          <Link href="/invoices" style={{ color: '#fbbf24', fontSize: 14 }}>View them →</Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: '#0d1220', border: '1px solid #1e2a3a',
            borderRadius: 14, padding: '20px 22px',
          }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.accent }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Link href="/invoices/new" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10, padding: '20px', borderRadius: 14, textDecoration: 'none',
          background: 'linear-gradient(135deg, rgba(34,211,238,0.1), rgba(129,140,248,0.1))',
          border: '1px solid rgba(129,140,248,0.3)', color: '#fff', fontSize: 15, fontWeight: 600,
        }}>
          ＋ Create New Invoice
        </Link>
        <Link href="/invoices" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10, padding: '20px', borderRadius: 14, textDecoration: 'none',
          background: '#0d1220', border: '1px solid #1e2a3a',
          color: '#94a3b8', fontSize: 15, fontWeight: 600,
        }}>
          View All Invoices →
        </Link>
      </div>
    </div>
  )
}