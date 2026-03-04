import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function FinancialProjectDetail({ params }: { params: { id: string } }) {
  const [{ data: p }, { data: expenses }, { data: settingsRows }] = await Promise.all([
    supabase.from('financial_projects').select('*, platforms(*), partners(*), service_types(*)').eq('id', params.id).single(),
    supabase.from('classified_expenses').select('*').eq('category', 'fixed').eq('is_recurring', true).is('project_id', null),
    supabase.from('settings').select('*'),
  ])

  if (!p) return notFound()

  const usdToPkr = Number(settingsRows?.find((s: any) => s.key === 'usd_to_pkr')?.value ?? 280)

  // Fixed cost allocation for this month
  const { data: monthProjects } = await supabase
    .from('financial_projects')
    .select('id, gross_value')
    .eq('status', 'active')

  const totalMonthRevenue = monthProjects?.reduce((s, mp) => s + Number(mp.gross_value), 0) ?? 0
  const totalFixedPKR = expenses?.reduce((s, e) => s + Number(e.amount), 0) ?? 0
  const revenueShare = totalMonthRevenue > 0 ? Number(p.gross_value) / totalMonthRevenue : 0
  const allocatedFixedPKR = totalFixedPKR * revenueShare

  // Business P&L (View A)
  const gross = Number(p.gross_value)
  const platform_fee = gross * ((p.platforms?.commission_pct ?? 0) / 100)
  const delivery = Number(p.delivery_cost ?? 0)
  const transfer = Number(p.transfer_fee ?? 0)
  const business_net = gross - platform_fee - delivery - transfer

  // Distribution (View B)
  const partner_cut = business_net > 0
    ? business_net * ((p.partners?.revenue_share_pct ?? 0) / 100)
    : 0
  const after_partner = business_net - partner_cut
  const charity = after_partner > 0 ? after_partner * 0.15 : 0
  const final_profit = after_partner - charity
  const final_margin = gross > 0 ? (final_profit / gross) * 100 : 0

  const viewASteps = [
    { label: 'Gross Revenue', value: gross, deduction: null },
    { label: `Platform Fee (${p.platforms?.commission_pct ?? 0}%)`, value: gross - platform_fee, deduction: platform_fee },
    { label: 'Delivery Costs', value: gross - platform_fee - delivery, deduction: delivery },
    { label: 'Transfer Fee', value: business_net, deduction: transfer },
  ]

  const viewBSteps = [
    { label: 'Business Net Profit', value: business_net, deduction: null },
    { label: `Partner Cut (${p.partners?.revenue_share_pct ?? 0}%)`, value: business_net - partner_cut, deduction: partner_cut },
    { label: 'Charity (15% of profit)', value: after_partner - charity, deduction: charity },
  ]

  return (
    <div style={{ maxWidth: 860 }}>
      <Link href="/finances/projects" style={{ fontSize: 13, color: '#5a5a5a', marginBottom: 16, display: 'inline-block' }}>
        ← Financial Projects
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>{p.name}</h1>
          <p style={{ fontSize: 13, color: '#5a5a5a', marginTop: 6 }}>
            {p.client_name || 'No client'} · {p.platforms?.name ?? 'No platform'} · {p.service_types?.name ?? 'No service'}
          </p>
        </div>
        <span style={{
          fontSize: 12, padding: '4px 14px', borderRadius: 999,
          background: final_margin < 15 ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)',
          color: final_margin < 15 ? '#f87171' : '#4ade80',
          border: `1px solid ${final_margin < 15 ? 'rgba(248,113,113,0.2)' : 'rgba(74,222,128,0.2)'}`,
        }}>{final_margin.toFixed(1)}% final margin</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* View A */}
        <div style={{
          background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: 24, boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>View A</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 20 }}>Business P&L</div>

          {viewASteps.map((step, i) => {
            const isLast = i === viewASteps.length - 1
            const pct = (step.value / gross * 100).toFixed(0)
            return (
              <div key={step.label} style={{ marginBottom: 8 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '9px 12px', borderRadius: 8,
                  background: isLast ? 'rgba(20,136,252,0.08)' : 'rgba(255,255,255,0.02)',
                  border: isLast ? '1px solid rgba(20,136,252,0.2)' : '1px solid transparent',
                }}>
                  <div>
                    <div style={{ fontSize: 12, color: isLast ? '#fff' : '#8a8a8f', fontWeight: isLast ? 600 : 400 }}>{step.label}</div>
                    {step.deduction !== null && step.deduction > 0 && (
                      <div style={{ fontSize: 11, color: '#f87171', marginTop: 1 }}>−${Number(step.deduction).toFixed(0)}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' as const }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isLast ? '#1488fc' : '#fff' }}>${Number(step.value).toFixed(0)}</div>
                    <div style={{ fontSize: 10, color: '#3a3a3a' }}>{pct}%</div>
                  </div>
                </div>
                <div style={{ height: 2, background: '#1a1a1a', borderRadius: 2, margin: '3px 0' }}>
                  <div style={{ height: '100%', borderRadius: 2, width: `${Math.max(0, Number(pct))}%`, background: isLast ? '#1488fc' : '#2a2a2a' }} />
                </div>
              </div>
            )
          })}

          {/* Allocated fixed costs (PKR, read-only) */}
          <div style={{
            marginTop: 12, padding: '10px 12px', borderRadius: 8,
            background: 'rgba(255,255,255,0.02)', border: '1px solid #1a1a1a',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 12, color: '#5a5a5a' }}>Allocated Fixed Cost (Monthly)</div>
              <div style={{ fontSize: 11, color: '#3a3a3a', marginTop: 1 }}>
                {(revenueShare * 100).toFixed(1)}% of ₨{totalFixedPKR.toLocaleString()} total fixed
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24' }}>
              ₨{allocatedFixedPKR.toFixed(0)}
            </div>
          </div>
        </div>

        {/* View B */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: 24, boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>View B</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 20 }}>Distribution</div>

            {viewBSteps.map((step, i) => (
              <div key={step.label} style={{ marginBottom: 8 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '9px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)',
                }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#8a8a8f' }}>{step.label}</div>
                    {step.deduction !== null && step.deduction > 0 && (
                      <div style={{ fontSize: 11, color: '#f87171', marginTop: 1 }}>−${Number(step.deduction).toFixed(0)}</div>
                    )}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>${Number(step.value).toFixed(0)}</div>
                </div>
              </div>
            ))}

            {/* Final retained */}
            <div style={{
              marginTop: 8, padding: '14px 12px', borderRadius: 8,
              background: final_profit > 0 ? 'rgba(20,136,252,0.08)' : 'rgba(248,113,113,0.08)',
              border: `1px solid ${final_profit > 0 ? 'rgba(20,136,252,0.2)' : 'rgba(248,113,113,0.2)'}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Final Retained Profit</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: final_profit > 0 ? '#1488fc' : '#f87171', letterSpacing: '-0.5px' }}>
                ${final_profit.toFixed(0)}
              </div>
            </div>
          </div>

          {/* Project details */}
          <div style={{
            background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: 20, boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
          }}>
            {[
              { label: 'Status', value: p.status },
              { label: 'Gross Value', value: `$${Number(p.gross_value).toLocaleString()}` },
              { label: 'Platform', value: p.platforms?.name ?? '—' },
              { label: 'Partner', value: p.partners?.name ?? '—' },
              { label: 'Service', value: p.service_types?.name ?? '—' },
              { label: 'Start Date', value: p.start_date ? new Date(p.start_date).toLocaleDateString() : '—' },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: '1px solid #1a1a1a', fontSize: 13,
              }}>
                <span style={{ color: '#5a5a5a' }}>{row.label}</span>
                <span style={{ color: '#e8e8e8', textTransform: 'capitalize' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}