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

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function Dashboard() {
  const [
    { data: invoices },
    { data: income },
    { data: expenses },
    { data: financialProjects },
    { data: milestones },
  ] = await Promise.all([
    supabase.from('invoices').select('*').order('created_at', { ascending: false }),
    supabase.from('income').select('*'),
    supabase.from('expenses').select('*'),
    supabase.from('financial_projects').select('*, platforms(*), partners(*)').order('created_at', { ascending: false }).limit(5),
    supabase.from('pm_milestones').select('*, pm_projects(id, name, pm_clients(name))').neq('status', 'approved').neq('status', 'delivered').order('due_date', { ascending: true }),
  ])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const totalRevenue = income?.reduce((sum, i) => sum + Number(i.amount), 0) ?? 0
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0
  const netProfit = totalRevenue - totalExpenses
  const pendingInvoices = invoices?.filter(i => i.status === 'sent' || i.status === 'overdue') ?? []
  const pendingTotal = pendingInvoices.reduce((sum, i) => sum + Number(i.total), 0)
  const overdueInvoices = invoices?.filter(i => i.status === 'overdue').length ?? 0

  const overdueMilestones = milestones?.filter(m => {
    if (!m.due_date) return false
    const due = new Date(m.due_date)
    due.setHours(0, 0, 0, 0)
    return due < today
  }) ?? []

  const dueTodayMilestones = milestones?.filter(m => {
    if (!m.due_date) return false
    const due = new Date(m.due_date)
    due.setHours(0, 0, 0, 0)
    return due.getTime() === today.getTime()
  }) ?? []

  const stats = [
    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}` },
    { label: 'Total Expenses', value: `$${totalExpenses.toLocaleString()}` },
    { label: 'Net Profit', value: `$${netProfit.toLocaleString()}` },
    { label: 'Pending Invoices', value: `$${pendingTotal.toLocaleString()}` },
  ]

  return (
    <div style={{ maxWidth: 960 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px', lineHeight: 1.1 }}>
          {getGreeting()} 👋
        </h1>
        <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 8 }}>Here's your Krufter overview.</p>
      </div>

      {/* Alerts row */}
      {(overdueInvoices > 0 || overdueMilestones.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {overdueMilestones.length > 0 && (
            <Link href="/projects/risk" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 18px', borderRadius: 10, textDecoration: 'none',
              background: 'rgba(248,113,113,0.06)',
              border: '1px solid rgba(248,113,113,0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>⚠️</span>
                <span style={{ fontSize: 13, color: '#f87171', fontWeight: 500 }}>
                  {overdueMilestones.length} overdue milestone{overdueMilestones.length > 1 ? 's' : ''} need attention
                </span>
              </div>
              <span style={{ fontSize: 12, color: '#f87171' }}>View Risk →</span>
            </Link>
          )}
          {dueTodayMilestones.length > 0 && (
            <Link href="/projects" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 18px', borderRadius: 10, textDecoration: 'none',
              background: 'rgba(251,191,36,0.06)',
              border: '1px solid rgba(251,191,36,0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>📅</span>
                <span style={{ fontSize: 13, color: '#fbbf24', fontWeight: 500 }}>
                  {dueTodayMilestones.length} milestone{dueTodayMilestones.length > 1 ? 's' : ''} due today
                </span>
              </div>
              <span style={{ fontSize: 12, color: '#fbbf24' }}>Work View →</span>
            </Link>
          )}
          {overdueInvoices > 0 && (
            <Link href="/invoices" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 18px', borderRadius: 10, textDecoration: 'none',
              background: 'rgba(248,113,113,0.04)',
              border: '1px solid rgba(248,113,113,0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>🧾</span>
                <span style={{ fontSize: 13, color: '#f87171' }}>
                  {overdueInvoices} overdue invoice{overdueInvoices > 1 ? 's' : ''}
                </span>
              </div>
              <span style={{ fontSize: 12, color: '#f87171' }}>View Invoices →</span>
            </Link>
          )}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {stats.map(s => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: 11, color: '#4a4a4a', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {s.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        <Link href="/projects/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', background: '#1488fc', borderRadius: 999,
          fontSize: 13, fontWeight: 500, color: '#fff',
          boxShadow: '0 0 20px rgba(20,136,252,0.3)',
        }}>+ New Project</Link>
        <Link href="/finances/projects/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999,
          fontSize: 13, fontWeight: 500, color: '#8a8a8f',
        }}>+ Finance Project</Link>
        <Link href="/invoices/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999,
          fontSize: 13, fontWeight: 500, color: '#8a8a8f',
        }}>+ Invoice</Link>
        <Link href="/projects" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999,
          fontSize: 13, fontWeight: 500, color: '#8a8a8f',
        }}>Work View →</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Overdue milestones preview */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
              Overdue Milestones
              {overdueMilestones.length > 0 && (
                <span style={{
                  marginLeft: 8, fontSize: 11, padding: '2px 7px', borderRadius: 999,
                  background: 'rgba(248,113,113,0.1)', color: '#f87171',
                  border: '1px solid rgba(248,113,113,0.2)',
                }}>{overdueMilestones.length}</span>
              )}
            </div>
            <Link href="/projects/risk" style={{ fontSize: 12, color: '#1488fc' }}>Risk View →</Link>
          </div>
          {overdueMilestones.length === 0 ? (
            <p style={{ fontSize: 13, color: '#4ade80' }}>✓ Nothing overdue</p>
          ) : overdueMilestones.slice(0, 4).map((m: any) => (
            <Link key={m.id} href={`/projects/${m.pm_projects?.id}`} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 0', borderBottom: '1px solid #1a1a1a', textDecoration: 'none',
            }}>
              <div>
                <div style={{ fontSize: 13, color: '#e8e8e8', fontWeight: 500 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: '#4a4a4a', marginTop: 2 }}>
                  {m.pm_projects?.pm_clients?.name && `${m.pm_projects.pm_clients.name} · `}
                  {m.pm_projects?.name}
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#f87171', fontWeight: 500, flexShrink: 0, marginLeft: 12 }}>
                {new Date(m.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </Link>
          ))}
          {overdueMilestones.length > 4 && (
            <Link href="/projects/risk" style={{ fontSize: 12, color: '#4a4a4a', marginTop: 10, display: 'block' }}>
              +{overdueMilestones.length - 4} more →
            </Link>
          )}
        </div>

        {/* Due today */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
              Due Today
              {dueTodayMilestones.length > 0 && (
                <span style={{
                  marginLeft: 8, fontSize: 11, padding: '2px 7px', borderRadius: 999,
                  background: 'rgba(251,191,36,0.1)', color: '#fbbf24',
                  border: '1px solid rgba(251,191,36,0.2)',
                }}>{dueTodayMilestones.length}</span>
              )}
            </div>
            <Link href="/projects" style={{ fontSize: 12, color: '#1488fc' }}>Work View →</Link>
          </div>
          {dueTodayMilestones.length === 0 ? (
            <p style={{ fontSize: 13, color: '#4ade80' }}>✓ Nothing due today</p>
          ) : dueTodayMilestones.slice(0, 4).map((m: any) => (
            <Link key={m.id} href={`/projects/${m.pm_projects?.id}`} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 0', borderBottom: '1px solid #1a1a1a', textDecoration: 'none',
            }}>
              <div>
                <div style={{ fontSize: 13, color: '#e8e8e8', fontWeight: 500 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: '#4a4a4a', marginTop: 2 }}>
                  {m.pm_projects?.pm_clients?.name && `${m.pm_projects.pm_clients.name} · `}
                  {m.pm_projects?.name}
                </div>
              </div>
              <span style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 999,
                background: 'rgba(251,191,36,0.1)', color: '#fbbf24',
                border: '1px solid rgba(251,191,36,0.2)', flexShrink: 0, marginLeft: 12,
              }}>Today</span>
            </Link>
          ))}
          {dueTodayMilestones.length > 4 && (
            <Link href="/projects" style={{ fontSize: 12, color: '#4a4a4a', marginTop: 10, display: 'block' }}>
              +{dueTodayMilestones.length - 4} more →
            </Link>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Recent finance projects */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Finance Projects</div>
            <Link href="/finances/projects" style={{ fontSize: 12, color: '#1488fc' }}>View all →</Link>
          </div>
          {!financialProjects?.length ? (
            <p style={{ fontSize: 13, color: '#4a4a4a' }}>No projects yet</p>
          ) : financialProjects.map((p: any) => {
            const platform_fee = Number(p.gross_value) * ((p.platforms?.commission_pct ?? 0) / 100)
            const after_platform = Number(p.gross_value) - platform_fee
            const partner_cut = after_platform * ((p.partners?.revenue_share_pct ?? 0) / 100)
            const business_net = Number(p.gross_value) - platform_fee - Number(p.delivery_cost ?? 0) - Number(p.transfer_fee ?? 0)
            const after_partner = business_net - partner_cut
            const charity = after_partner > 0 ? after_partner * 0.15 : 0
            const final_profit = after_partner - charity
            const margin = p.gross_value > 0 ? (final_profit / p.gross_value) * 100 : 0
            return (
              <Link key={p.id} href={`/finances/projects/${p.id}`} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 0', borderBottom: '1px solid #1a1a1a', textDecoration: 'none',
              }}>
                <div>
                  <div style={{ fontSize: 13, color: '#e8e8e8', fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#4a4a4a', marginTop: 2 }}>{p.platforms?.name ?? '—'}</div>
                </div>
                <div style={{ textAlign: 'right' as const }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>${final_profit.toFixed(0)}</div>
                  <div style={{ fontSize: 11, color: margin < 15 ? '#f87171' : '#4a4a4a', marginTop: 2 }}>{margin.toFixed(1)}%</div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Recent invoices */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Recent Invoices</div>
            <Link href="/invoices" style={{ fontSize: 12, color: '#1488fc' }}>View all →</Link>
          </div>
          {!invoices?.length ? (
            <p style={{ fontSize: 13, color: '#4a4a4a' }}>No invoices yet</p>
          ) : invoices.slice(0, 5).map((inv: any) => (
            <Link key={inv.id} href={`/invoices/${inv.id}`} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 0', borderBottom: '1px solid #1a1a1a', textDecoration: 'none',
            }}>
              <div>
                <div style={{ fontSize: 13, color: '#e8e8e8', fontWeight: 500 }}>#{inv.invoice_number} · {inv.client_name}</div>
                <div style={{ fontSize: 11, color: '#4a4a4a', marginTop: 2 }}>
                  {new Date(inv.created_at).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>${Number(inv.total).toLocaleString()}</div>
                <span style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: 999,
                  background: `${statusColors[inv.status] ?? '#5a5a5a'}15`,
                  color: statusColors[inv.status] ?? '#5a5a5a',
                  border: `1px solid ${statusColors[inv.status] ?? '#5a5a5a'}30`,
                  textTransform: 'capitalize',
                }}>{inv.status}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}