import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import SnapshotButton from './snapshotButton'

const card = {
  background: '#1e1e22',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
  padding: '22px 24px',
  boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
}

function calcBusinessPL(p: any) {
  const gross = Number(p.gross_value)
  const platform_fee = gross * ((p.platforms?.commission_pct ?? 0) / 100)
  const delivery = Number(p.delivery_cost ?? 0)
  const transfer = Number(p.transfer_fee ?? 0)
  const business_net = gross - platform_fee - delivery - transfer
  return { gross, platform_fee, delivery, transfer, business_net }
}

function calcDistribution(business_net: number, p: any) {
  const partner_cut = business_net > 0
    ? business_net * ((p.partners?.revenue_share_pct ?? 0) / 100)
    : 0
  const after_partner = business_net - partner_cut
  const charity = after_partner > 0 ? after_partner * 0.15 : 0
  const final_profit = after_partner - charity
  return { partner_cut, charity, final_profit }
}

export default async function FinanceDashboard() {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [
    { data: projects },
    { data: expenses },
    { data: snapshots },
    { data: settingsRows },
  ] = await Promise.all([
    supabase.from('financial_projects').select('*, platforms(*), partners(*), service_types(*)').order('created_at', { ascending: false }),
    supabase.from('classified_expenses').select('*'),
    supabase.from('monthly_snapshots').select('*').order('month', { ascending: false }).limit(6),
    supabase.from('settings').select('*'),
  ])

  const usdToPkr = Number(settingsRows?.find((s: any) => s.key === 'usd_to_pkr')?.value ?? 280)

  // Business P&L totals
  const totalGross = projects?.reduce((s, p) => s + Number(p.gross_value), 0) ?? 0
  const totalBusinessNet = projects?.reduce((s, p) => s + calcBusinessPL(p).business_net, 0) ?? 0

  // Distribution totals
  const totalPartnerCuts = projects?.reduce((s, p) => {
    const { business_net } = calcBusinessPL(p)
    return s + calcDistribution(business_net, p).partner_cut
  }, 0) ?? 0
  const totalCharity = projects?.reduce((s, p) => {
    const { business_net } = calcBusinessPL(p)
    return s + calcDistribution(business_net, p).charity
  }, 0) ?? 0
  const totalFinalProfit = projects?.reduce((s, p) => {
    const { business_net } = calcBusinessPL(p)
    return s + calcDistribution(business_net, p).final_profit
  }, 0) ?? 0

  // Fixed costs
  const fixedExpensesPKR = expenses?.filter(e => e.category === 'fixed' && e.is_recurring && (!e.project_id)).reduce((s, e) => s + Number(e.amount), 0) ?? 0
  const fixedExpensesUSD = fixedExpensesPKR / usdToPkr

  // Break-even
  const avgContributionMargin = totalGross > 0 ? totalBusinessNet / totalGross : 0
  const breakEvenRevenue = avgContributionMargin > 0 ? fixedExpensesUSD / avgContributionMargin : 0

  // Alerts
  const alerts: { type: 'warn' | 'danger'; msg: string }[] = []
  projects?.forEach(p => {
    const { business_net } = calcBusinessPL(p)
    const { final_profit } = calcDistribution(business_net, p)
    const margin = p.gross_value > 0 ? (final_profit / p.gross_value) * 100 : 0
    if (margin < 15 && p.status === 'active') {
      alerts.push({ type: 'danger', msg: `"${p.name}" final margin is ${margin.toFixed(0)}% — below 15%` })
    }
  })
  if (totalGross > 0) {
    const platformCounts: Record<string, number> = {}
    projects?.forEach(p => {
      const name = p.platforms?.name ?? 'Unknown'
      platformCounts[name] = (platformCounts[name] ?? 0) + Number(p.gross_value)
    })
    Object.entries(platformCounts).forEach(([name, val]) => {
      if (val / totalGross > 0.8) alerts.push({ type: 'warn', msg: `${(val / totalGross * 100).toFixed(0)}% revenue from ${name} — concentration risk` })
    })
  }
  if (totalGross > 0 && breakEvenRevenue > totalGross) {
    alerts.push({ type: 'danger', msg: `Revenue ($${totalGross.toFixed(0)}) is below break-even ($${breakEvenRevenue.toFixed(0)})` })
  }

  const existingSnapshot = snapshots?.find((s: any) => s.month === currentMonth)

  return (
    <div style={{ maxWidth: 980 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>Finances</h1>
          <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 6 }}>Decision-grade. Updated in real time.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/finances/projects/new" style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '9px 18px', background: '#1488fc', borderRadius: 999,
            boxShadow: '0 0 20px rgba(20,136,252,0.3)',
            fontSize: 13, fontWeight: 500, color: '#fff',
          }}>+ New Project</Link>
          <Link href="/finances/expenses" style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '9px 18px', background: 'rgba(255,255,255,0.05)',
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

      {/* View A — Business P&L */}
      <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        View A — Business P&L
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 8 }}>
        {[
          { label: 'Gross Revenue', value: `$${totalGross.toLocaleString()}` },
          { label: 'Platform + Delivery + Transfer', value: `-$${(totalGross - totalBusinessNet).toFixed(0)}`, red: true },
          { label: 'Business Net Profit', value: `$${totalBusinessNet.toFixed(0)}` },
          { label: 'Fixed Monthly Burn', value: `₨${fixedExpensesPKR.toLocaleString()}` },
        ].map(s => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.red ? '#f87171' : '#fff', letterSpacing: '-0.5px' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Break-even */}
      <div style={{
        ...card, marginBottom: 20,
        display: 'flex', gap: 32, alignItems: 'center',
        borderColor: breakEvenRevenue > totalGross ? 'rgba(248,113,113,0.2)' : 'rgba(74,222,128,0.15)',
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Break-Even Revenue</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: breakEvenRevenue > totalGross ? '#f87171' : '#4ade80', letterSpacing: '-0.5px' }}>
            ${breakEvenRevenue.toFixed(0)}
          </div>
          <div style={{ fontSize: 12, color: '#4a4a4a', marginTop: 4 }}>
            Fixed costs ÷ avg contribution margin ({(avgContributionMargin * 100).toFixed(1)}%)
          </div>
        </div>
        <div style={{ width: 1, height: 60, background: '#1a1a1a' }} />
        <div>
          <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Fixed Costs (PKR)</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>₨{fixedExpensesPKR.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: '#4a4a4a', marginTop: 4 }}>≈ ${fixedExpensesUSD.toFixed(0)} at ₨{usdToPkr}/USD</div>
        </div>
        <div style={{ width: 1, height: 60, background: '#1a1a1a' }} />
        <div>
          <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Status</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: breakEvenRevenue > totalGross ? '#f87171' : '#4ade80' }}>
            {breakEvenRevenue > totalGross
              ? `₨${((breakEvenRevenue - totalGross) * usdToPkr).toFixed(0)} below break-even`
              : `₨${((totalGross - breakEvenRevenue) * usdToPkr).toFixed(0)} above break-even`}
          </div>
        </div>
      </div>

      {/* View B — Distribution */}
      <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        View B — Distribution
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Business Net Profit', value: `$${totalBusinessNet.toFixed(0)}` },
          { label: 'Partner Payouts', value: `-$${totalPartnerCuts.toFixed(0)}`, red: true },
          { label: 'Charity (15% of profit)', value: `-$${totalCharity.toFixed(0)}`, yellow: true },
          { label: 'Final Retained Profit', value: `$${totalFinalProfit.toFixed(0)}`, blue: true },
        ].map(s => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', color: s.blue ? '#1488fc' : s.red ? '#f87171' : s.yellow ? '#fbbf24' : '#fff' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Recent projects */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Recent Projects</div>
            <Link href="/finances/projects" style={{ fontSize: 12, color: '#1488fc' }}>View all →</Link>
          </div>
          {!projects?.length ? (
            <p style={{ fontSize: 13, color: '#4a4a4a' }}>No projects yet</p>
          ) : projects.slice(0, 5).map((p: any) => {
            const { business_net } = calcBusinessPL(p)
            const { final_profit } = calcDistribution(business_net, p)
            const margin = p.gross_value > 0 ? (final_profit / p.gross_value) * 100 : 0
            return (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #1a1a1a' }}>
                <div>
                  <div style={{ fontSize: 13, color: '#e8e8e8', fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#4a4a4a', marginTop: 2 }}>{p.platforms?.name ?? '—'} · {p.service_types?.name ?? '—'}</div>
                </div>
                <div style={{ textAlign: 'right' as const }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>${final_profit.toFixed(0)}</div>
                  <div style={{ fontSize: 11, color: margin < 15 ? '#f87171' : '#4a4a4a', marginTop: 2 }}>{margin.toFixed(1)}% margin</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Monthly snapshots */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Monthly Snapshots</div>
            <SnapshotButton
              currentMonth={currentMonth}
              hasSnapshot={!!existingSnapshot}
              totalRevenue={totalGross}
              totalCostsUsd={totalGross - totalBusinessNet}
              fixedCostsPkr={fixedExpensesPKR}
              businessNetProfit={totalBusinessNet}
              charityPaid={totalCharity}
              partnerPayouts={totalPartnerCuts}
              finalRetainedProfit={totalFinalProfit}
            />
          </div>
          {!snapshots?.length ? (
            <p style={{ fontSize: 13, color: '#4a4a4a' }}>No snapshots yet. Take one at month end.</p>
          ) : snapshots.map((s: any) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #1a1a1a' }}>
              <div>
                <div style={{ fontSize: 13, color: '#e8e8e8', fontWeight: 500 }}>{s.month}</div>
                <div style={{ fontSize: 11, color: '#4a4a4a', marginTop: 2 }}>Revenue: ${Number(s.total_revenue).toFixed(0)}</div>
              </div>
              <div style={{ textAlign: 'right' as const }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1488fc' }}>${Number(s.final_retained_profit).toFixed(0)}</div>
                <div style={{ fontSize: 11, color: '#4a4a4a', marginTop: 2 }}>retained</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nav cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { href: '/finances/projects', label: 'Projects P&L', icon: '📁', desc: 'Per-project profit' },
          { href: '/finances/expenses', label: 'Expenses', icon: '💸', desc: 'Classified costs' },
          { href: '/finances/platforms', label: 'Platforms', icon: '⚙️', desc: 'Fee rules engine' },
          { href: '/finances/partners', label: 'Partners', icon: '🤝', desc: 'Revenue shares' },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{ ...card, display: 'block', textDecoration: 'none' }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{item.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 12, color: '#5a5a5a' }}>{item.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}