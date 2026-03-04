'use client'
import { useState } from 'react'
import Link from 'next/link'

const statusConfig: Record<string, { label: string; color: string }> = {
  not_started:       { label: 'Not Started',      color: '#6b7280' },
  in_progress:       { label: 'In Progress',       color: '#60a5fa' },
  delivered:         { label: 'Delivered',         color: '#6ee7b7' },
  approved:          { label: 'Approved',          color: '#34d399' },
  waiting_on_client: { label: 'Waiting on Client', color: '#fbbf24' },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function PeopleList({ people }: { people: any[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div style={{ maxWidth: 760 }}>
      <Link href="/projects" style={{ fontSize: 13, color: '#5a5a5a', marginBottom: 16, display: 'inline-block' }}>
        ← Work View
      </Link>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>People</h1>
        <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 6 }}>
          Active workload per person. Click to expand milestones.
        </p>
      </div>

      {people.length === 0 ? (
        <div style={{
          background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, textAlign: 'center', padding: '60px 20px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
          <p style={{ fontSize: 14, color: '#5a5a5a' }}>No active assignments</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {people.map(p => {
            const isExpanded = expanded === p.id
            return (
              <div key={p.id} style={{
                background: '#1e1e22',
                border: `1px solid ${p.overdueCount > 0 ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 12, overflow: 'hidden',
                boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
              }}>
                {/* Person row */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : p.id)}
                  style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '16px 22px',
                    background: 'transparent', border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit',
                    textAlign: 'left' as const,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', background: '#1488fc',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                      {(p.full_name || p.email || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>
                        {p.full_name || p.email?.split('@')[0]}
                      </div>
                      <div style={{ fontSize: 12, color: '#4a4a4a', marginTop: 2, textTransform: 'capitalize' as const }}>
                        {p.role}
                      </div>
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
                    <span style={{
                      fontSize: 12, color: '#3a3a3a',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                      display: 'inline-block',
                    }}>▾</span>
                  </div>
                </button>

                {/* Expanded milestones */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #1a1a1a' }}>
                    {p.milestones.length === 0 ? (
                      <div style={{ padding: '20px 22px', fontSize: 13, color: '#4a4a4a' }}>
                        No milestones
                      </div>
                    ) : p.milestones.map((m: any, i: number) => {
                      const due = m.due_date ? new Date(m.due_date) : null
                      if (due) due.setHours(0, 0, 0, 0)
                      const isOverdue = due && due < today
                      const sc = statusConfig[m.status] ?? statusConfig.not_started

                      return (
                        <div key={m.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '11px 22px 11px 70px',
                          borderBottom: i < p.milestones.length - 1 ? '1px solid #141416' : 'none',
                          background: isOverdue ? 'rgba(248,113,113,0.03)' : 'transparent',
                        }}>
                          <div>
                            <div style={{ fontSize: 13, color: '#e8e8e8', marginBottom: 3 }}>
                              {m.name}
                            </div>
                            <Link href={`/projects/${m.pm_projects?.id}`} style={{
                              fontSize: 11, color: '#1488fc', textDecoration: 'none',
                            }}>
                              {m.pm_projects?.pm_clients?.name
                                ? `${m.pm_projects.pm_clients.name} · `
                                : ''}
                              {m.pm_projects?.name ?? '—'} →
                            </Link>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                            <span style={{
                              fontSize: 12,
                              color: isOverdue ? '#f87171' : '#6b7280',
                              fontWeight: isOverdue ? 600 : 400,
                            }}>
                              {m.due_date ? formatDate(m.due_date) : '—'}
                              {isOverdue && ' · overdue'}
                            </span>
                            <span style={{
                              fontSize: 11, padding: '3px 8px', borderRadius: 999,
                              background: `${sc.color}15`,
                              color: sc.color,
                              border: `1px solid ${sc.color}25`,
                              whiteSpace: 'nowrap' as const,
                            }}>
                              {sc.label}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}