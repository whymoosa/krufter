import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const card = {
  background: '#1e1e22',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
  padding: '22px 24px',
  boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
}

function calcProject(p: any) {
  const platform_fee = p.gross_value * ((p.platforms?.commission_pct ?? 0) / 100)
  const after_platform = p.gross_value - platform_fee
  const partner_cut = after_platform * ((p.partners?.revenue_share_pct ?? 0) / 100)
  const charity = after_platform * 0.15
  const after_structural = after_platform - partner_cut - charity - (p.transfer_fee ?? 0)
  const net_profit = after_structural - (p.delivery_cost ?? 0)
  const margin_pct = p.gross_value > 0 ? (net_profit / p.gross_value) * 100 : 0
  return { platform_fee, partner_cut, charity, net_profit, margin_pct }
}

export default async function FinanceDashboard() {
  const [
    { data: projects },
    { data: expenses },
    { data: platforms },
  ] = await Promise.all([
    supabase.from('financial_projects').select('*, platforms(*), partners(*), service_types(*)').order('created_at', { ascending: false }),
    supabase.from('classified_expenses').select('*').order('date', { ascending: false }),
    supabase.from('platforms').select('*'),
  ])

  const activeProjects = projects?.filter(p => p.status === 'active') ?? []
  const completedProjects = projects?.filter(p => p.status === 'completed') ?? []

  const totalGross = projects?.reduce((s, p) => s + Number(p.gross_value), 0) ?? 0
  const totalNetProfit = projects?.reduce((s, p) => s + calcProject(p).net_profit, 0) ?? 0
  const totalExpenses = expenses?.reduce((s, e) => s + Number(e.amount), 0) ?? 0
  const avgMargin = projects?.length ? projects.reduce((s, p) => s + calcProject(p).margin_pct, 0) / projects.length : 0

  // Monthly burn (fixed recurring expenses in PKR)
  const fixedMonthly = expenses?.filter(e => e.category === 'fixed' && e.is_recurring).reduce((s, e) => s + Number(e.amount), 0) ?? 0

  // By service type
  const byService: Record<string, { gross: number; profit: number; count: number }> = {}
  projects?.forEach(p => {
    const svc = p.service_types?.name ?? 'Unknown'
    if (!byService[svc]) byService[svc] = { gross: 0, profit: 0, count: 0 }
    byService[svc].gross += Number(p.gross_value)
    byService[svc].profit += calcProject(p).net_profit
    byService[svc].count++
  })

  // Risk alerts
  const alerts: { type: 'warn' | 'danger'; msg: string }[] = []
  projects?.forEach(p => {
    const { margin_pct } = calcProject(p)
    if (margin_pct < 15 && p.status === 'active') {
      alerts.push({ type: 'danger', msg: `"${p.name}" margin is ${margin_pct.toFixed(0)}% — below 15% threshold` })
    }
  })
  if (totalGross > 0) {
    const platformCounts: Record<string, number> = {}
    projects?.forEach(p => {
      const name = p.platforms?.name ?? 'Unknown'
      platformCounts[name] = (platformCounts[name] ?? 0) + Number(p.gross_value)
    })
    Object.entries(platformCounts).forEach(([name, val]) => {
      if (val / totalGross > 0.8) {
        alerts.push({ type: 'warn', msg: `${(val / totalGross * 100).toFixed(0)}% of revenue from ${name} — platform concentration risk` })
      }
    })
  }
  if (totalGross > 0 && fixedMonthly / (totalGross / 12) > 0.4) {
    alerts.push({ type: 'warn', msg: `Fixed costs are ${((fixedMonthly / (totalGross / 12)) * 100).toFixed(0)}% of avg monthly revenue` })
  }

  const stats = [
    { label: 'Total Gross', value: `$${totalGross.toLocaleString()}` },
    { label: 'Net Profit', value: `$${totalNetProfit.toLocaleString()}` },
    { label: 'Avg Margin', value: `${avgMargin.toFixed(1)}%` },
    { label: 'Active Projects', value: String(activeProjects.length) },
  ]

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>Finances</h1>
          <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 6 }}>Decision-grade financial overview.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/finances/projects/new" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '9px 18px', background: '#1488fc', borderRadius: 999,
            boxShadow: '0 0 20px rgba(20,136,252,0.3)',
            fontSize: 13, fontWeight: 500, color: '#fff',
          }}>+ New Project</Link>
          <Link href="/finances/expenses" style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '9px 18px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 999, fontSize: 13, color: '#8a8a8f',
          }}>Log Expense</Link>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {alerts.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 16px', borderRadius: 10, fontSize: 13,
              background: a.type === 'danger' ? 'rgba(248,113,113,0.06)' : 'rgba(251,191,36,0.06)',
              border: `1px solid ${a.type === 'danger' ? 'rgba(248,113,113,0.2)' : 'rgba(251,191,36,0.2)'}`,
            }}>
              <span>{a.type === 'danger' ? '⚠️' : '💡'}</span>
              <span style={{ color: a.type === 'danger' ? '#f87171' : '#fbbf24' }}>{a.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {stats.map(s => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Margin by service */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 18 }}>
            Margin by Service
          </div>
          {Object.keys(byService).length === 0 ? (
            <p style={{ fontSize: 13, color: '#4a4a4a' }}>No projects yet</p>
          ) : Object.entries(byService).sort((a, b) => b[1].profit - a[1].profit).map(([svc, data]) => {
            const margin = data.gross > 0 ? (data.profit / data.gross) * 100 : 0
            const isLow = margin < 15
            return (
              <div key={svc} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: '#e8e8e8' }}>{svc}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: isLow ? '#f87171' : '#fff' }}>
                    {margin.toFixed(1)}% · {data.count} project{data.count > 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ height: 4, background: '#1a1a1a', borderRadius: 4 }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    width: `${Math.min(100, Math.max(0, margin))}%`,
                    background: isLow ? '#f87171' : '#1488fc',
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Recent projects */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Recent Projects</div>
            <Link href="/finances/projects" style={{ fontSize: 12, color: '#1488fc' }}>View all →</Link>
          </div>
          {!projects?.length ? (
            <p style={{ fontSize: 13, color: '#4a4a4a' }}>No projects yet</p>
          ) : projects.slice(0, 5).map((p: any) => {
            const { net_profit, margin_pct } = calcProject(p)
            return (
              <div key={p.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 0', borderBottom: '1px solid #1a1a1a',
              }}>
                <div>
                  <div style={{ fontSize: 13, color: '#e8e8e8', fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#4a4a4a', marginTop: 2 }}>
                    {p.platforms?.name ?? 'No platform'} · {p.service_types?.name ?? 'No service'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' as const }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                    ${net_profit.toFixed(0)}
                  </div>
                  <div style={{ fontSize: 11, color: margin_pct < 15 ? '#f87171' : '#4a4a4a', marginTop: 2 }}>
                    {margin_pct.toFixed(1)}% margin
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Nav cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { href: '/finances/projects', label: 'Projects', icon: '📁', desc: 'P&L per project' },
          { href: '/finances/expenses', label: 'Expenses', icon: '💸', desc: 'Classified costs' },
          { href: '/finances/platforms', label: 'Platforms', icon: '⚙️', desc: 'Fee rules engine' },
          { href: '/finances/partners', label: 'Partners', icon: '🤝', desc: 'Revenue shares' },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{
            ...card, display: 'block', textDecoration: 'none',
            transition: 'border-color 0.15s',
          }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{item.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 12, color: '#5a5a5a' }}>{item.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}