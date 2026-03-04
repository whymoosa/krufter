import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function RiskPage() {
  const { data: milestones } = await supabase
    .from('pm_milestones')
    .select('*, pm_projects(id, name, pm_clients(name))')
    .neq('status', 'approved')
    .order('due_date', { ascending: true })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const overdue = milestones?.filter(m => {
    if (!m.due_date) return false
    const due = new Date(m.due_date)
    due.setHours(0, 0, 0, 0)
    return due < today
  }) ?? []

  const highRevision = milestones?.filter(m => m.revision_count > 2) ?? []

  const Section = ({ title, items, color, desc }: any) => (
    <div style={{ marginBottom: 32 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#4a4a4a' }}>{desc}</div>
      </div>
      <div style={{
        background: '#1e1e22', border: `1px solid ${color}20`,
        borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
      }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: 14, color: '#4ade80' }}>✓ All clear</p>
          </div>
        ) : items.map((m: any, i: number) => (
          <div key={m.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '13px 20px',
            borderBottom: i < items.length - 1 ? '1px solid #1a1a1a' : 'none',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', marginBottom: 3 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: '#4a4a4a' }}>
                {m.pm_projects?.pm_clients?.name ?? '—'} · {m.pm_projects?.name ?? '—'}
              </div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              {m.due_date && (
                <div style={{ fontSize: 12, color, fontWeight: 600 }}>
                  {new Date(m.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              )}
              {m.revision_count > 0 && (
                <div style={{ fontSize: 11, color: '#f87171', marginTop: 2 }}>↩ {m.revision_count} revisions</div>
              )}
              <Link href={`/projects/${m.pm_projects?.id}`} style={{ fontSize: 11, color: '#1488fc', marginTop: 4, display: 'block' }}>
                View project →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 760 }}>
      <Link href="/projects" style={{ fontSize: 13, color: '#5a5a5a', marginBottom: 16, display: 'inline-block' }}>← Work View</Link>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>Risk View</h1>
        <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 6 }}>Things that need attention now.</p>
      </div>
      <Section title="Overdue Milestones" items={overdue} color="#f87171" desc="Past due date, not yet approved." />
      <Section title="High Revision Count" items={highRevision} color="#fbbf24" desc="More than 2 revisions — likely a scope or quality issue." />
    </div>
  )
}