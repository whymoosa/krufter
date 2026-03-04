'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  not_started:      { label: 'Not Started',       color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  in_progress:      { label: 'In Progress',        color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  delivered:        { label: 'Delivered',          color: '#6ee7b7', bg: 'rgba(110,231,183,0.1)' },
  approved:         { label: 'Approved',           color: '#34d399', bg: 'rgba(52,211,153,0.1)'  },
  waiting_on_client:{ label: 'Waiting on Client',  color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'  },
}

function getSection(m: any): 'overdue' | 'today' | 'upcoming' {
  if (!m.due_date) return 'upcoming'
  const due = new Date(m.due_date)
  const today = new Date()
  today.setHours(0,0,0,0)
  due.setHours(0,0,0,0)
  if (due < today) return 'overdue'
  if (due.getTime() === today.getTime()) return 'today'
  return 'upcoming'
}

function formatDate(d: string) {
  const date = new Date(d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function WorkView({ milestones, profiles }: { milestones: any[]; profiles: any[] }) {
  const router = useRouter()
  const [items, setItems] = useState(milestones)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const overdue  = items.filter(m => getSection(m) === 'overdue')
  const today    = items.filter(m => getSection(m) === 'today')
  const upcoming = items.filter(m => getSection(m) === 'upcoming')

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    await supabase.from('pm_milestones').update({ status }).eq('id', id)
    setItems(prev => prev.map(m => m.id === id ? { ...m, status } : m).filter(m => status !== 'approved' || m.id !== id))
    setUpdatingId(null)
  }

  const markDelivered = async (id: string) => {
    setUpdatingId(id)
    await supabase.from('pm_milestones').update({ status: 'delivered' }).eq('id', id)
    setItems(prev => prev.map(m => m.id === id ? { ...m, status: 'delivered' } : m))
    setUpdatingId(null)
  }

  const profileName = (id: string) => {
    const p = profiles.find(p => p.id === id)
    return p?.full_name || p?.email?.split('@')[0] || '—'
  }

  const Section = ({ title, items, accent }: { title: string; items: any[]; accent: string }) => {
    if (items.length === 0) return null
    return (
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {title}
          </span>
          <span style={{ fontSize: 11, color: '#3a3a3a' }}>{items.length}</span>
        </div>

        <div style={{
          background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '180px 1fr 1fr 160px 90px 130px 100px',
            padding: '9px 20px',
            borderBottom: '1px solid #1a1a1a',
            fontSize: 10, color: '#3a3a3a',
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            {['Client', 'Project', 'Milestone', 'Assigned', 'Due', 'Status', ''].map(h => (
              <div key={h}>{h}</div>
            ))}
          </div>

          {items.map((m, i) => {
            const sc = statusConfig[m.status] ?? statusConfig.not_started
            const isLast = i === items.length - 1
            const isUpdating = updatingId === m.id
            return (
              <div key={m.id} style={{
                display: 'grid',
                gridTemplateColumns: '180px 1fr 1fr 160px 90px 130px 100px',
                alignItems: 'center',
                padding: '11px 20px',
                borderBottom: isLast ? 'none' : '1px solid #141416',
                opacity: isUpdating ? 0.5 : 1,
                transition: 'opacity 0.15s',
              }}>
                <Link href="/projects/clients" style={{
  fontSize: 12, color: '#8a8a8f', overflow: 'hidden',
  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  textDecoration: 'none',
  transition: 'color 0.15s',
}}>
  {m.pm_projects?.pm_clients?.name ?? '—'}
</Link>
<Link href={`/projects/${m.pm_projects?.id}`} style={{
  fontSize: 13, color: '#e8e8e8', fontWeight: 500,
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  textDecoration: 'none',
  display: 'flex', alignItems: 'center', gap: 6,
}}>
  {m.pm_projects?.priority === 'high' && (
    <span style={{ color: '#fbbf24', fontSize: 10 }}>●</span>
  )}
  {m.pm_projects?.name ?? '—'}
</Link>
                <div style={{ fontSize: 13, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.name}
                  {m.revision_count > 0 && (
                    <span style={{ fontSize: 10, color: '#f87171', marginLeft: 6 }}>
                      ↩{m.revision_count}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.assigned_to ? profileName(m.assigned_to) : '—'}
                </div>
                <div style={{ fontSize: 12, color: accent, fontWeight: 500 }}>
                  {m.due_date ? formatDate(m.due_date) : '—'}
                </div>
                <div>
                  <select
                    value={m.status}
                    onChange={e => updateStatus(m.id, e.target.value)}
                    disabled={isUpdating}
                    style={{
                      background: sc.bg, color: sc.color,
                      border: `1px solid ${sc.color}30`,
                      borderRadius: 999, padding: '4px 8px',
                      fontSize: 11, cursor: 'pointer',
                      fontFamily: 'inherit', outline: 'none',
                    }}
                  >
                    {Object.entries(statusConfig).map(([val, cfg]) => (
                      <option key={val} value={val} style={{ background: '#1e1e22', color: cfg.color }}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  {m.status !== 'delivered' && m.status !== 'approved' && (
                    <button
                      onClick={() => markDelivered(m.id)}
                      disabled={isUpdating}
                      style={{
                        padding: '4px 10px',
                        background: 'rgba(110,231,183,0.08)',
                        border: '1px solid rgba(110,231,183,0.2)',
                        borderRadius: 999, cursor: 'pointer',
                        fontSize: 11, color: '#6ee7b7',
                        fontFamily: 'inherit',
                      }}
                    >Deliver</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>Work</h1>
          <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 6 }}>
            {overdue.length > 0 && <span style={{ color: '#f87171', fontWeight: 500 }}>{overdue.length} overdue · </span>}
            {today.length} due today · {upcoming.length} upcoming
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/projects/risk" style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '9px 16px',
            background: overdue.length > 0 ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${overdue.length > 0 ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 999, fontSize: 13,
            color: overdue.length > 0 ? '#f87171' : '#8a8a8f',
          }}>Risk View</Link>
          <Link href="/projects/people" style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '9px 16px', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 999, fontSize: 13, color: '#8a8a8f',
          }}>People</Link>
          <Link href="/projects/clients" style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '9px 16px', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 999, fontSize: 13, color: '#8a8a8f',
          }}>Clients</Link>
          <Link href="/projects/new" style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '9px 18px', background: '#1488fc', borderRadius: 999,
            boxShadow: '0 0 20px rgba(20,136,252,0.3)',
            fontSize: 13, fontWeight: 500, color: '#fff',
          }}>+ New Project</Link>
        </div>
      </div>

      {overdue.length === 0 && today.length === 0 && upcoming.length === 0 ? (
        <div style={{
          background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, textAlign: 'center', padding: '80px 20px',
        }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>✅</div>
          <p style={{ fontSize: 15, color: '#5a5a5a', marginBottom: 8 }}>No active milestones</p>
          <Link href="/projects/new" style={{ fontSize: 13, color: '#1488fc' }}>Create a project →</Link>
        </div>
      ) : (
        <>
          <Section title="Overdue" items={overdue} accent="#f87171" />
          <Section title="Due Today" items={today} accent="#fbbf24" />
          <Section title="Upcoming" items={upcoming} accent="#60a5fa" />
        </>
      )}
    </div>
  )
}