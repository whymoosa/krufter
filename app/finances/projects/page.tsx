import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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

const statusColors: Record<string, string> = {
  active: '#1488fc', completed: '#4ade80', refunded: '#f87171', paused: '#fbbf24'
}

export default async function FinancialProjectsPage() {
  const { data: projects } = await supabase
    .from('financial_projects')
    .select('*, platforms(*), partners(*), service_types(*)')
    .order('created_at', { ascending: false })

  const totalGross = projects?.reduce((s, p) => s + Number(p.gross_value), 0) ?? 0
  const totalProfit = projects?.reduce((s, p) => s + calcProject(p).net_profit, 0) ?? 0

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>Financial Projects</h1>
          <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 6 }}>
            {projects?.length ?? 0} projects · ${totalGross.toLocaleString()} gross · ${totalProfit.toFixed(0)} net profit
          </p>
        </div>
        <Link href="/finances/projects/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '9px 18px', background: '#1488fc', borderRadius: 999,
          boxShadow: '0 0 20px rgba(20,136,252,0.3)',
          fontSize: 13, fontWeight: 500, color: '#fff',
        }}>+ New Project</Link>
      </div>

      {!projects?.length ? (
        <div style={{
          background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, textAlign: 'center', padding: '80px 20px',
        }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>📁</div>
          <p style={{ fontSize: 15, color: '#5a5a5a', marginBottom: 8 }}>No projects yet</p>
          <Link href="/finances/projects/new" style={{ fontSize: 13, color: '#1488fc' }}>
            Add your first project →
          </Link>
        </div>
      ) : (
        <div style={{
          background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}>
          {/* Header row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 100px 100px 90px 90px 90px 80px',
            padding: '11px 20px',
            borderBottom: '1px solid #1a1a1a',
            fontSize: 11, color: '#3a3a3a',
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            {['Project', 'Platform', 'Service', 'Gross', 'Net Profit', 'Margin', 'Status'].map(h => (
              <div key={h}>{h}</div>
            ))}
          </div>

          {projects.map((p: any, i: number) => {
            const { platform_fee, partner_cut, charity, net_profit, margin_pct } = calcProject(p)
            const isLow = margin_pct < 15
            return (
              <Link key={p.id} href={`/finances/projects/${p.id}`} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 100px 100px 90px 90px 90px 80px',
                alignItems: 'center',
                padding: '13px 20px',
                borderBottom: i < projects.length - 1 ? '1px solid #1a1a1a' : 'none',
                textDecoration: 'none',
                transition: 'background 0.1s',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#4a4a4a', marginTop: 2 }}>{p.client_name || '—'}</div>
                </div>
                <div style={{ fontSize: 12, color: '#8a8a8f' }}>{p.platforms?.name ?? '—'}</div>
                <div style={{ fontSize: 12, color: '#8a8a8f' }}>{p.service_types?.name ?? '—'}</div>
                <div style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>
                  ${Number(p.gross_value).toLocaleString()}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: net_profit > 0 ? '#fff' : '#f87171' }}>
                  ${net_profit.toFixed(0)}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: isLow ? '#f87171' : '#4ade80' }}>
                  {margin_pct.toFixed(1)}%
                </div>
                <div>
                  <span style={{
                    fontSize: 11, padding: '3px 8px', borderRadius: 999,
                    background: `${statusColors[p.status] ?? '#5a5a5a'}15`,
                    color: statusColors[p.status] ?? '#5a5a5a',
                    border: `1px solid ${statusColors[p.status] ?? '#5a5a5a'}30`,
                    textTransform: 'capitalize',
                  }}>{p.status}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}