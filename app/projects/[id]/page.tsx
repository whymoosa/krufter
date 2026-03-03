'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const urgencyColors: Record<string, string> = {
  low: '#4a4a4a', normal: '#1488fc', high: '#fbbf24', urgent: '#f87171'
}
const statusColors: Record<string, string> = {
  todo: '#4a4a4a', in_progress: '#1488fc', review: '#fbbf24', done: '#4ade80'
}

const inputStyle = {
  background: '#141416', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, padding: '10px 14px', color: '#e8e8e8',
  fontSize: 14, width: '100%', outline: 'none', fontFamily: 'inherit',
}

const lbl = (t: string) => (
  <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 7 }}>{t}</div>
)

export default function ProjectDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Task form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [urgency, setUrgency] = useState('normal')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchProject()
    fetchTasks()
    fetchMembers()
  }, [id])

  const fetchProject = async () => {
    const { data } = await supabase.from('projects').select('*').eq('id', id).single()
    setProject(data)
  }

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*, profiles(full_name, email, role)')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
    setTasks(data ?? [])
  }

  const fetchMembers = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, email, role')
    setMembers(data ?? [])
  }

  const createTask = async () => {
    if (!title) return alert('Task title required')
    setSaving(true)
    const { error } = await supabase.from('tasks').insert({
      project_id: id, title, description,
      assigned_to: assignedTo || null,
      urgency, due_date: dueDate || null, notes,
    })
    if (error) { alert(error.message); setSaving(false); return }
    setTitle(''); setDescription(''); setAssignedTo('')
    setUrgency('normal'); setDueDate(''); setNotes('')
    setShowTaskForm(false)
    setSaving(false)
    fetchTasks()
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    await supabase.from('tasks').update({ status }).eq('id', taskId)
    fetchTasks()
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', taskId)
    fetchTasks()
  }

  if (!project) return (
    <div style={{ color: '#5a5a5a', fontSize: 14 }}>Loading...</div>
  )

  const grouped = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    review: tasks.filter(t => t.status === 'review'),
    done: tasks.filter(t => t.status === 'done'),
  }

  return (
    <div style={{ maxWidth: 920 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Link href="/projects" style={{ fontSize: 13, color: '#5a5a5a', marginBottom: 12, display: 'inline-block' }}>
          ← Projects
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>{project.name}</h1>
            <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 6 }}>
              {project.client_name || 'No client'}{project.deadline ? ` · Due ${new Date(project.deadline).toLocaleDateString()}` : ''}
            </p>
          </div>
          <button onClick={() => setShowTaskForm(!showTaskForm)} style={{
            padding: '10px 20px', background: '#1488fc', border: 'none', borderRadius: 999,
            boxShadow: '0 0 20px rgba(20,136,252,0.3)',
            cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#fff', fontFamily: 'inherit',
          }}>+ Add Task</button>
        </div>
      </div>

      {/* Task form */}
      {showTaskForm && (
        <div style={{
          background: '#1e1e22', border: '1px solid rgba(20,136,252,0.2)',
          borderRadius: 12, padding: 24, marginBottom: 24,
          boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 18 }}>New Task</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              {lbl('Task Title *')}
              <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="Write homepage copy" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              {lbl('Description')}
              <textarea style={{ ...inputStyle, height: 70, resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="What needs to be done?" />
            </div>
            <div>
              {lbl('Assign To')}
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.id} value={m.id} style={{ background: '#1e1e22' }}>
                    {m.full_name || m.email} ({m.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              {lbl('Urgency')}
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={urgency} onChange={e => setUrgency(e.target.value)}>
                {['low', 'normal', 'high', 'urgent'].map(u => (
                  <option key={u} value={u} style={{ background: '#1e1e22', textTransform: 'capitalize' }}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              {lbl('Due Date')}
              <input style={inputStyle} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div>
              {lbl('Notes')}
              <input style={inputStyle} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any extra context..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={createTask} disabled={saving} style={{
              padding: '10px 20px', background: '#1488fc', border: 'none', borderRadius: 999,
              cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#fff', fontFamily: 'inherit',
            }}>{saving ? 'Saving...' : 'Create Task'}</button>
            <button onClick={() => setShowTaskForm(false)} style={{
              padding: '10px 20px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999,
              cursor: 'pointer', fontSize: 13, color: '#5a5a5a', fontFamily: 'inherit',
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Task columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {Object.entries(grouped).map(([status, statusTasks]) => (
          <div key={status}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: statusColors[status],
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: 10, padding: '0 4px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>{status.replace('_', ' ')}</span>
              <span style={{ color: '#3a3a3a' }}>{statusTasks.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {statusTasks.map((task: any) => (
                <div key={task.id} style={{
                  background: '#1e1e22',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10, padding: '14px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', marginBottom: 8, lineHeight: 1.3 }}>
                    {task.title}
                  </div>
                  {task.description && (
                    <div style={{ fontSize: 12, color: '#5a5a5a', marginBottom: 8, lineHeight: 1.4 }}>
                      {task.description}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 999,
                      background: `${urgencyColors[task.urgency]}15`,
                      color: urgencyColors[task.urgency],
                      border: `1px solid ${urgencyColors[task.urgency]}30`,
                      textTransform: 'capitalize',
                    }}>{task.urgency}</span>
                    {task.due_date && (
                      <span style={{ fontSize: 10, color: '#4a4a4a', padding: '2px 8px', background: '#141416', borderRadius: 999 }}>
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {task.profiles && (
                    <div style={{ fontSize: 11, color: '#5a5a5a', marginBottom: 10 }}>
                      → {task.profiles.full_name || task.profiles.email}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select
                      value={task.status}
                      onChange={e => updateTaskStatus(task.id, e.target.value)}
                      style={{
                        flex: 1, background: '#141416',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 6, padding: '4px 6px',
                        color: '#8a8a8f', fontSize: 11,
                        cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                      }}
                    >
                      {['todo', 'in_progress', 'review', 'done'].map(s => (
                        <option key={s} value={s} style={{ background: '#1e1e22' }}>
                          {s.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => deleteTask(task.id)} style={{
                      padding: '4px 8px', background: 'transparent',
                      border: '1px solid rgba(248,113,113,0.2)',
                      borderRadius: 6, cursor: 'pointer',
                      fontSize: 11, color: '#f87171', fontFamily: 'inherit',
                    }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}