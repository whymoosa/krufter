import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function PeoplePage() {
  const [{ data: profiles }, { data: milestones }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, role'),
    supabase.from('pm_milestones').select('assigned_to, status, due_date').neq('status', 'approved'),
  ])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const people = profiles?.map(p => {
    const assigned = milestones?.filter(m => m.assigned_to === p.id) ?? []
    const overdue = assigned.filter(m => {
      if (!m.due_date) return false
      const due = new Date(m.due_date)
      due.setHours(0, 0, 0, 0)
      return due < today
    })
    return { ...p, activeMilestones: assigned.length, overdueCount: overdue.length }
  }).filter(p => p.activeMilestones > 0) ?? []

  return (
    <div style={{ maxWidth: 760 }}>
      <Link href="/projects" style={{ fontSize: 13, color: '#5a5a5a', marginBottom: 16, display: 'inline-block' }}>← Work View</Link>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>People</h1>
        <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 6 }}>Active workload per person.</p>
      </div>

      <div style={{
        background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
      }}>
        {people.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
            <p style={{ fontSize: 14, color: '#5a5a5a' }}>No active assignments</p>
          </div>
        ) : people.map((p, i) => (
          <div key={p.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 22px',
            borderBottom: i < people.length - 1 ? '1px solid #1a1a1a' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: '#1488fc',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: '#fff',
              }}>
                {(p.full_name || p.email || '?')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>
                  {p.full_name || p.email?.split('@')[0]}
                </div>
                <div style={{ fontSize: 12, color: '#4a4a4a', marginTop: 2, textTransform: 'capitalize' }}>{p.role}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ textAlign: 'right' as const }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{p.activeMilestones}</div>
                <div style={{ fontSize: 11, color: '#4a4a4a' }}>active</div>
              </div>
              {p.overdueCount > 0 && (
                <div style={{ textAlign: 'right' as const }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#f87171' }}>{p.overdueCount}</div>
                  <div style={{ fontSize: 11, color: '#f87171' }}>overdue</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}