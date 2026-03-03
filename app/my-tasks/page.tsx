'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const urgencyColors: Record<string, string> = {
  low: '#4a4a4a', normal: '#1488fc', high: '#fbbf24', urgent: '#f87171'
}
const statusColors: Record<string, string> = {
  todo: '#5a5a5a', in_progress: '#1488fc', review: '#fbbf24', done: '#4ade80'
}

export default function MyTasks() {
  const [tasks, setTasks] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchMyTasks()
  }, [])

  const fetchMyTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: prof } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)

    const { data } = await supabase
      .from('tasks')
      .select('*, projects(name, client_name), deliverables(*)')
      .eq('assigned_to', user.id)
      .order('due_date', { ascending: true })

    setTasks(data ?? [])
    setLoading(false)
  }

  const updateStatus = async (taskId: string, status: string) => {
    await supabase.from('tasks').update({ status }).eq('id', taskId)
    fetchMyTasks()
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f0f',
      backgroundImage: 'radial-gradient(circle at 60% 10%, rgba(20,136,252,0.05) 0%, transparent 50%)',
    }}>
      {/* Top nav */}
      <div style={{
        borderBottom: '1px solid #1a1a1a',
        padding: '16px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.4px' }}>
          Krufter
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 13, color: '#5a5a5a' }}>
            {profile?.full_name || profile?.email}
            <span style={{
              marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 999,
              background: 'rgba(20,136,252,0.1)', color: '#1488fc',
              border: '1px solid rgba(20,136,252,0.2)', textTransform: 'capitalize',
            }}>{profile?.role}</span>
          </div>
          <button onClick={signOut} style={{
            padding: '6px 14px', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999,
            cursor: 'pointer', fontSize: 12, color: '#5a5a5a', fontFamily: 'inherit',
          }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 32px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>
            My Tasks
          </h1>
          <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 6 }}>
            {tasks.filter(t => t.status !== 'done').length} active · {tasks.filter(t => t.status === 'done').length} completed
          </p>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#1e1e22', borderRadius: 999, padding: 4, width: 'fit-content' }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'todo', label: 'To Do' },
            { key: 'in_progress', label: 'In Progress' },
            { key: 'review', label: 'Review' },
            { key: 'done', label: 'Done' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
              padding: '7px 16px', borderRadius: 999,
              background: filter === tab.key ? '#1488fc' : 'transparent',
              border: 'none', cursor: 'pointer',
              fontSize: 13, color: filter === tab.key ? '#fff' : '#5a5a5a',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}>{tab.label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ fontSize: 14, color: '#4a4a4a' }}>Loading your tasks...</div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
            <p style={{ fontSize: 15, color: '#5a5a5a' }}>No tasks here</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((task: any) => (
              <div key={task.id} style={{
                background: '#1e1e22',
                border: `1px solid ${task.urgency === 'urgent' ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 12, padding: '18px 20px',
                boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#5a5a5a' }}>
                      {task.projects?.name}
                      {task.projects?.client_name ? ` · ${task.projects.client_name}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 16 }}>
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 999,
                      background: `${urgencyColors[task.urgency]}15`,
                      color: urgencyColors[task.urgency],
                      border: `1px solid ${urgencyColors[task.urgency]}30`,
                      textTransform: 'capitalize',
                    }}>{task.urgency}</span>
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 999,
                      background: `${statusColors[task.status]}15`,
                      color: statusColors[task.status],
                      border: `1px solid ${statusColors[task.status]}30`,
                      textTransform: 'capitalize',
                    }}>{task.status.replace('_', ' ')}</span>
                  </div>
                </div>

                {task.description && (
                  <div style={{ fontSize: 13, color: '#8a8a8f', marginBottom: 12, lineHeight: 1.5 }}>
                    {task.description}
                  </div>
                )}

                {task.notes && (
                  <div style={{
                    fontSize: 12, color: '#5a5a5a', marginBottom: 12,
                    padding: '8px 12px', background: '#141416', borderRadius: 8,
                    borderLeft: '2px solid #2a2a2a',
                  }}>
                    📝 {task.notes}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {task.due_date && (
                      <span style={{ fontSize: 12, color: '#4a4a4a' }}>
                        Due {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                    {task.deliverables?.length > 0 && (
                      <span style={{ fontSize: 12, color: '#4ade80' }}>
                        {task.deliverables.length} deliverable{task.deliverables.length > 1 ? 's' : ''} submitted
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      value={task.status}
                      onChange={e => updateStatus(task.id, e.target.value)}
                      style={{
                        background: '#141416',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8, padding: '6px 10px',
                        color: '#e8e8e8', fontSize: 12,
                        cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                      }}
                    >
                      {['todo', 'in_progress', 'review', 'done'].map(s => (
                        <option key={s} value={s} style={{ background: '#1e1e22' }}>
                          {s.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                    <Link href={`/my-tasks/${task.id}`} style={{
                      padding: '6px 14px',
                      background: 'rgba(20,136,252,0.1)',
                      border: '1px solid rgba(20,136,252,0.2)',
                      borderRadius: 8, fontSize: 12, color: '#1488fc',
                    }}>Submit Work →</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}