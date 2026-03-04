'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  not_started:       { label: 'Not Started',       color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  in_progress:       { label: 'In Progress',        color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  delivered:         { label: 'Delivered',          color: '#6ee7b7', bg: 'rgba(110,231,183,0.1)' },
  approved:          { label: 'Approved',           color: '#34d399', bg: 'rgba(52,211,153,0.1)'  },
  waiting_on_client: { label: 'Waiting on Client',  color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'  },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isOverdue(due: string, status: string) {
  if (status === 'approved' || status === 'delivered') return false
  return new Date(due) < new Date()
}

export default function MilestonesView({ project, milestones: initial, profiles }: any) {
  const router = useRouter()
  const [milestones, setMilestones] = useState(initial)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [msName, setMsName] = useState('')
  const [msDue, setMsDue] = useState('')
  const [msAssigned, setMsAssigned] = useState('')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  const profileName = (id: string) => {
    const p = profiles.find((p: any) => p.id === id)
    return p?.full_name || p?.email?.split('@')[0] || '—'
  }

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    await supabase.from('pm_milestones').update({ status }).eq('id', id)
    setMilestones((prev: any[]) => prev.map(m => m.id === id ? { ...m, status } : m))
    setUpdatingId(null)
  }

  const incrementRevision = async (id: string, current: number) => {
    setUpdatingId(id)
    await supabase.from('pm_milestones').update({ revision_count: current + 1 }).eq('id', id)
    setMilestones((prev: any[]) => prev.map(m => m.id === id ? { ...m, revision_count: current + 1 } : m))
    setUpdatingId(null)
  }

  const addMilestone = async () => {
    if (!msName) return
    setSaving(true)
    const { data } = await supabase.from('pm_milestones').insert({
      project_id: project.id,
      name: msName,
      due_date: msDue || null,
      assigned_to: msAssigned || null,
      status: 'not_started',
    }).select().single()
    if (data) setMilestones((prev: any[]) => [...prev, data])
    setMsName(''); setMsDue(''); setMsAssigned('')
    setSaving(false)
    setShowAdd(false)
  }

  const deleteMilestone = async (id: string) => {
    if (!confirm('Delete this milestone?')) return
    await supabase.from('pm_milestones').delete().eq('id', id)
    setMilestones((prev: any[]) => prev.filter(m => m.id !== id))
  }

  const generateNextMonth = async () => {
    setGenerating(true)
    const { data: templates } = await supabase
      .from('milestone_templates')
      .select('*')
      .eq('project_id', project.id)

    if (!templates?.length) {
      alert('No template found.')
      setGenerating(false)
      return
    }

    const next = new Date()
    next.setMonth(next.getMonth() + 1)
    next.setDate(28)

    const { data: newMs } = await supabase.from('pm_milestones').insert(
      templates.map((t: any) => ({
        project_id: project.id,
        name: t.name,
        due_date: next.toISOString().split('T')[0],
        assigned_to: t.assigned_to || null,
        status: 'not_started',
        is_generated: true,
      }))
    ).select()

    if (newMs) setMilestones((prev: any[]) => [...prev, ...newMs])
    setGenerating(false)
  }

  const deleteProject = async () => {
    if (!confirm(`Delete project "${project.name}"? This will remove all milestones.`)) return
    await supabase.from('pm_projects').delete().eq('id', project.id)
    router.push('/projects')
  }

  const statusCounts = milestones.reduce((acc: any, m: any) => {
    acc[m.status] = (acc[m.status] ?? 0) + 1
    return acc
  }, {})

  const done = statusCounts['approved'] ?? 0
  const total = milestones.length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div style={{ maxWidth: 860 }}>
      <Link href="/projects" style={{ fontSize: 13, color: '#5a5a5a', marginBottom: 16, display: 'inline-block' }}>
        ← Work View
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>{project.name}</h1>
            {project.priority === 'high' && (
              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>High Priority</span>
            )}
            {project.project_type === 'recurring' && (
              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: 'rgba(129,140,248,0.1)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.2)' }}>↻ Monthly</span>
            )}
          </div>
          <p style={{ fontSize: 13, color: '#5a5a5a' }}>
            {project.pm_clients?.name || 'No client'} · {project.service_type || 'No service'}
            {project.financial_projects?.name && ` · 💰 ${project.financial_projects.name}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {project.project_type === 'recurring' && (
            <button onClick={generateNextMonth} disabled={generating} style={{
              padding: '8px 14px', background: 'rgba(129,140,248,0.08)',
              border: '1px solid rgba(129,140,248,0.2)', borderRadius: 999,
              cursor: 'pointer', fontSize: 12, color: '#818cf8', fontFamily: 'inherit',
            }}>{generating ? 'Generating...' : '+ Next Month'}</button>
          )}
          <button onClick={() => setShowAdd(!showAdd)} style={{
            padding: '8px 16px', background: '#1488fc', border: 'none', borderRadius: 999,
            cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#fff', fontFamily: 'inherit',
            boxShadow: '0 0 16px rgba(20,136,252,0.3)',
          }}>+ Milestone</button>
          <button onClick={deleteProject} style={{
            padding: '8px 14px', background: 'transparent',
            border: '1px solid rgba(248,113,113,0.2)', borderRadius: 999,
            cursor: 'pointer', fontSize: 12, color: '#f87171', fontFamily: 'inherit',
          }}>Delete</button>
        </div>
      </div>

      {/* Progress */}
      <div style={{
        background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12, padding: '16px 22px', marginBottom: 16,
        display: 'flex', gap: 24, alignItems: 'center',
        boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#5a5a5a' }}>Progress</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{done}/{total} approved</span>
          </div>
          <div style={{ height: 4, background: '#1a1a1a', borderRadius: 4 }}>
            <div style={{ height: '100%', borderRadius: 4, width: `${progress}%`, background: '#1488fc', transition: 'width 0.3s' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {Object.entries(statusConfig).map(([key, cfg]) => {
            const count = statusCounts[key] ?? 0
            if (count === 0) return null
            return (
              <span key={key} style={{ fontSize: 12, color: cfg.color }}>
                {count} {cfg.label}
              </span>
            )
          })}
        </div>
      </div>

      {/* Add milestone form */}
      {showAdd && (
        <div style={{
          background: '#1e1e22', border: '1px solid rgba(20,136,252,0.2)',
          borderRadius: 12, padding: 20, marginBottom: 16,
          boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 1fr auto', gap: 10 }}>
            <input
              style={{ background: '#141416', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 14px', color: '#e8e8e8', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
              value={msName} onChange={e => setMsName(e.target.value)}
              placeholder="Milestone name"
              onKeyDown={e => e.key === 'Enter' && addMilestone()}
              autoFocus
            />
            <input
              style={{ background: '#141416', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 14px', color: '#e8e8e8', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
              type="date" value={msDue} onChange={e => setMsDue(e.target.value)}
            />
            <select
              style={{ background: '#141416', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 14px', color: '#e8e8e8', fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
              value={msAssigned} onChange={e => setMsAssigned(e.target.value)}
            >
              <option value="">Unassigned</option>
              {profiles.map((p: any) => (
                <option key={p.id} value={p.id} style={{ background: '#1e1e22' }}>
                  {p.full_name || p.email?.split('@')[0]}
                </option>
              ))}
            </select>
            <button onClick={addMilestone} disabled={saving || !msName} style={{
              padding: '10px 18px', background: '#1488fc', border: 'none', borderRadius: 8,
              cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#fff', fontFamily: 'inherit',
            }}>Add</button>
          </div>
        </div>
      )}

      {/* Milestones list */}
      <div style={{
        background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
      }}>
        {milestones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
            <p style={{ fontSize: 14, color: '#5a5a5a' }}>No milestones yet</p>
          </div>
        ) : milestones.map((m: any, i: number) => {
          const sc = statusConfig[m.status] ?? statusConfig.not_started
          const overdue = m.due_date && isOverdue(m.due_date, m.status)
          const isUpdating = updatingId === m.id
          return (
            <div key={m.id} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 140px 160px 130px 80px 60px',
              alignItems: 'center',
              padding: '13px 20px',
              borderBottom: i < milestones.length - 1 ? '1px solid #141416' : 'none',
              opacity: isUpdating ? 0.5 : 1,
              transition: 'opacity 0.15s',
              background: overdue ? 'rgba(248,113,113,0.03)' : 'transparent',
            }}>
              <div>
                <div style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>
                  {m.name}
                  {m.revision_count > 0 && (
                    <span style={{ fontSize: 11, color: '#f87171', marginLeft: 8 }}>↩ {m.revision_count} revision{m.revision_count > 1 ? 's' : ''}</span>
                  )}
                </div>
                {m.assigned_to && (
                  <div style={{ fontSize: 11, color: '#4a4a4a', marginTop: 2 }}>{profileName(m.assigned_to)}</div>
                )}
              </div>
              <div style={{ fontSize: 12, color: overdue ? '#f87171' : '#6b7280', fontWeight: overdue ? 600 : 400 }}>
                {m.due_date ? formatDate(m.due_date) : '—'}
                {overdue && <span style={{ fontSize: 10, marginLeft: 4 }}>overdue</span>}
              </div>
              <div>
                <select
                  value={m.status}
                  onChange={e => updateStatus(m.id, e.target.value)}
                  disabled={isUpdating}
                  style={{
                    background: sc.bg, color: sc.color,
                    border: `1px solid ${sc.color}30`,
                    borderRadius: 999, padding: '5px 10px',
                    fontSize: 11, cursor: 'pointer',
                    fontFamily: 'inherit', outline: 'none',
                  }}
                >
                  {Object.entries(statusConfig).map(([val, cfg]) => (
                    <option key={val} value={val} style={{ background: '#1e1e22', color: cfg.color }}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <button onClick={() => incrementRevision(m.id, m.revision_count)} disabled={isUpdating} style={{
                  padding: '4px 10px', background: 'transparent',
                  border: '1px solid rgba(248,113,113,0.2)', borderRadius: 999,
                  cursor: 'pointer', fontSize: 11, color: '#f87171', fontFamily: 'inherit',
                }}>↩ Revise</button>
              </div>
              <div>
                {m.status !== 'delivered' && m.status !== 'approved' && (
                  <button onClick={() => updateStatus(m.id, 'delivered')} disabled={isUpdating} style={{
                    padding: '4px 10px', background: 'rgba(110,231,183,0.08)',
                    border: '1px solid rgba(110,231,183,0.2)', borderRadius: 999,
                    cursor: 'pointer', fontSize: 11, color: '#6ee7b7', fontFamily: 'inherit',
                  }}>Deliver</button>
                )}
              </div>
              <div>
                <button onClick={() => deleteMilestone(m.id)} style={{
                  padding: '4px 8px', background: 'transparent',
                  border: 'none', cursor: 'pointer', fontSize: 13, color: '#3a3a3a', fontFamily: 'inherit',
                }}>✕</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}