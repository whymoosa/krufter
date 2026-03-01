import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const card = {
  background: '#1e1e22',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
  padding: '22px 24px',
  boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
}

export default async function FinancesPage() {
  const { data: income } = await supabase.from('income').select('*').order('date', { ascending: false })
  const { data: expenses } = await supabase.from('expenses').select('*').order('date', { ascending: false })

  const totalIncome = income?.reduce((sum, i) => sum + Number(i.amount), 0) ?? 0
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0
  const netProfit = totalIncome - totalExpenses

  const months: { label: string; income: number; expenses: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const label = d.toLocaleString('default', { month: 'short' })
    const y = d.getFullYear(), m = d.getMonth()
    const mIncome = income?.filter(r => { const d2 = new Date(r.date); return d2.getFullYear() === y && d2.getMonth() === m }).reduce((s, r) => s + Number(r.amount), 0) ?? 0
    const mExp = expenses?.filter(r => { const d2 = new Date(r.date); return d2.getFullYear() === y && d2.getMonth() === m }).reduce((s, r) => s + Number(r.amount), 0) ?? 0
    months.push({ label, income: mIncome, expenses: mExp })
  }
  const maxVal = Math.max(...months.map(m => Math.max(m.income, m.expenses)), 1)

  const stats = [
    { label: 'Total Income', value: `$${totalIncome.toLocaleString()}`, color: '#4ade80' },
    { label: 'Total Expenses', value: `$${totalExpenses.toLocaleString()}`, color: '#f87171' },
    { label: 'Net Profit', value: `$${netProfit.toLocaleString()}`, color: netProfit >= 0 ? '#1488fc' : '#f87171' },
  ]

  return (
    <div style={{ maxWidth: 880 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>Finances</h1>
          <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 8 }}>Your profit & loss overview.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/finances/income/new" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '9px 18px',
            background: 'rgba(74,222,128,0.1)',
            border: '1px solid rgba(74,222,128,0.2)',
            borderRadius: 999, fontSize: 13, color: '#4ade80',
          }}>+ Income</Link>
          <Link href="/finances/expenses/new" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '9px 18px',
            background: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: 999, fontSize: 13, color: '#f87171',
          }}>+ Expense</Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: 11, color: '#4a4a4a', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ ...card, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 24 }}>Monthly P&L — Last 6 Months</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 130 }}>
          {months.map((m) => (
            <div key={m.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: '100%', display: 'flex', gap: 3, alignItems: 'flex-end', height: 110 }}>
                <div style={{
                  flex: 1, borderRadius: '3px 3px 0 0',
                  height: `${(m.income / maxVal) * 110}px`,
                  background: '#1488fc',
                  minHeight: m.income > 0 ? 3 : 0,
                  opacity: 0.8,
                }} />
                <div style={{
                  flex: 1, borderRadius: '3px 3px 0 0',
                  height: `${(m.expenses / maxVal) * 110}px`,
                  background: '#f87171',
                  minHeight: m.expenses > 0 ? 3 : 0,
                  opacity: 0.7,
                }} />
              </div>
              <div style={{ fontSize: 11, color: '#3a3a3a' }}>{m.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 16 }}>
          {[{ color: '#1488fc', label: 'Income' }, { color: '#f87171', label: 'Expenses' }].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
              <span style={{ fontSize: 12, color: '#4a4a4a' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {[
          { title: 'Recent Income', data: income, color: '#4ade80', prefix: '+', empty: 'No income logged yet.' },
          { title: 'Recent Expenses', data: expenses, color: '#f87171', prefix: '-', empty: 'No expenses logged yet.' },
        ].map(section => (
          <div key={section.title} style={card}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16 }}>{section.title}</div>
            {!section.data?.length ? (
              <p style={{ fontSize: 13, color: '#3a3a3a' }}>{section.empty}</p>
            ) : section.data.slice(0, 5).map((item: any) => (
              <div key={item.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: '1px solid #1a1a1a',
              }}>
                <div>
                  <div style={{ fontSize: 13, color: '#e8e8e8' }}>{item.description || 'Entry'}</div>
                  <div style={{ fontSize: 11, color: '#3a3a3a', marginTop: 2 }}>
                    {item.category || 'Uncategorized'} · {new Date(item.date).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: section.color }}>
                  {section.prefix}${Number(item.amount).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}