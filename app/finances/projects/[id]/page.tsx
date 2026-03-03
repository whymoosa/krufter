import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'

function calcProject(p: any) {
  const platform_fee = p.gross_value * ((p.platforms?.commission_pct ?? 0) / 100)
  const after_platform = p.gross_value - platform_fee
  const partner_cut = after_platform * ((p.partners?.revenue_share_pct ?? 0) / 100)
  const charity = after_platform * 0.15
  const after_structural = after_platform - partner_cut - charity - (p.transfer_fee ?? 0)
  const net_profit = after_structural - (p.delivery_cost ?? 0)
  const margin_pct = p.gross_value > 0 ? (net_profit / p.gross_value) * 100 : 0
  return { platform_fee, partner_cut, charity, after_structural, net_profit, margin_pct }
}

export default async function FinancialProjectDetail({ params }: { params: { id: string } }) {
  const { data: p } = await supabase
    .from('financial_projects')
    .select('*, platforms(*), partners(*), service_types(*)')
    .eq('id', params.id)
    .single()

  if (!p) return notFound()

  const { platform_fee, partner_cut, charity, after_structural, net_profit, margin_pct } = calcProject(p)

  const steps = [
    { label: 'Gross Value', value: p.gross_value, deduction: null },
    { label: `Platform Fee (${p.platforms?.commission_pct ?? 0}%)`, value: p.gross_value - platform_fee, deduction: platform_fee },
    { label: `Partner Cut (${p.partners?.revenue_share_pct ?? 0}%)`, value: p.gross_value - platform_fee - partner_cut, deduction: partner_cut },
    { label: 'Charity (15%)', value: p.gross_value - platform_fee - partner_cut - charity, deduction: charity },
    { label: 'Transfer Fee', value: after_structural, deduction: p.transfer_fee },
    { label: 'Delivery Costs', value: net_profit, deduction: p.delivery_cost },
  ]

  return (
    <div style={{ maxWidth: 800 }}>
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
          background: margin_pct < 15 ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)',
          color: margin_pct < 15 ? '#f87171' : '#4ade80',
          border: `1px solid ${margin_pct < 15 ? 'rgba(248,113,113,0.2)' : 'rgba(74,222,128,0.2)'}`,
        }}>{margin_pct.toFixed(1)}% margin</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Waterfall */}
        <div style={{
          background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: 24, boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 20 }}>Profit Waterfall</div>
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1
            const pct = (step.value / p.gross_value * 100).toFixed(0)
            return (
              <div key={step.label} style={{ marginBottom: 8 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '9px 12px', borderRadius: 8,
                  background: isLast ? 'rgba(20,136,252,0.08)' : 'rgba(255,255,255,0.02)',
                  border: isLast ? '1px solid rgba(20,136,252,0.2)' : '1px solid transparent',
                }}>
                  <div>
                    <div style={{ fontSize: 12, color: isLast ? '#fff' : '#8a8a8f', fontWeight: isLast ? 600 : 400 }}>
                      {step.label}
                    </div>
                    {step.deduction !== null && step.deduction > 0 && (
                      <div style={{ fontSize: 11, color: '#f87171', marginTop: 1 }}>
                        −${Number(step.deduction).toFixed(0)}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' as const }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isLast ? '#1488fc' : '#fff' }}>
                      ${Number(step.value).toFixed(0)}
                    </div>
                    <div style={{ fontSize: 10, color: '#3a3a3a' }}>{pct}%</div>
                  </div>
                </div>
                <div style={{ height: 2, background: '#1a1a1a', borderRadius: 2, margin: '3px 0' }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    width: `${Math.max(0, Number(pct))}%`,
                    background: isLast ? '#1488fc' : '#2a2a2a',
                  }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Project details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: 22, boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Details</div>
            {[
              { label: 'Status', value: p.status },
              { label: 'Gross Value', value: `$${Number(p.gross_value).toLocaleString()}` },
              { label: 'Delivery Cost', value: `$${Number(p.delivery_cost).toLocaleString()}` },
              { label: 'Transfer Fee', value: `$${Number(p.transfer_fee).toLocaleString()}` },
              { label: 'Platform', value: p.platforms?.name ?? '—' },
              { label: 'Partner', value: p.partners?.name ?? '—' },
              { label: 'Service', value: p.service_types?.name ?? '—' },
              { label: 'Start Date', value: p.start_date ? new Date(p.start_date).toLocaleDateString() : '—' },
              { label: 'End Date', value: p.end_date ? new Date(p.end_date).toLocaleDateString() : '—' },
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

          {p.notes && (
            <div style={{
              background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: 18, fontSize: 13, color: '#6a6a6f', lineHeight: 1.5,
              boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
            }}>
              📝 {p.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}