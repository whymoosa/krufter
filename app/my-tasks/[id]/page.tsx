'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const urgencyColors: Record<string, string> = {
  low: '#4a4a4a', normal: '#1488fc', high: '#fbbf24', urgent: '#f87171'
}

const inputStyle = {
  background: '#141416', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, padding: '10px 14px', color: '#e8e8e8',
  fontSize: 14, width: '100%', outline: 'none', fontFamily: 'inherit',
}

const lbl = (t: string) => (
  <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 7 }}>{t}</div>
)

export default function TaskDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [task, setTask] = useState<any>(null)
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Deliverable form
  const [type, setType] = useState<'link' | 'note'>('link')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    fetchTask()
    fetchDeliverables()
  }, [id])

  const fetchTask = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*, projects(name, client_name)')
      .eq('id', id)
      .single()
    setTask(data)
    setLoading(false)
  }

  const fetchDeliverables = async () => {
    const { data } = await supabase
      .from('deliverables')
      .select('*')
      .eq('task_id', id)
      .order('created_at', { ascending: false })
    setDeliverables(data ?? [])
  }

  const updateStatus = async (status: string) => {
    await supabase.from('tasks').update({ status }).eq('id', id)
    fetchTask()
  }

  const submitDeliverable = async () => {
    if (!title) return alert('Please add a title')
    if (type === 'link' && !url) return alert('Please add a URL')
    if (type === 'note' && !content) return alert('Please add content')

    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('deliverables').insert({
      task_id: id,
      submitted_by: user?.id,
      type, title,
      url: type === 'link' ? url : null,
      content: type === 'note' ? content : null,
    })

    if (error) { alert(error.message); setSubmitting(false); return }

    setTitle(''); setUrl(''); setContent('')
    setSubmitting(false)
    fetchDeliverables()

    // Auto move to review
    if (task?.status === 'in_progress') {
      await updateStatus('review')
    }
  }

  const deleteDeliverable = async (delId: string) => {
    await supabase.from('deliverables').delete().eq('id', delId)
    fetchDeliverables()
  }

  if (loading) return <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a5a5a', fontSize: 14 }}>Loading...</div>
  if (!task) return <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a5a5a', fontSize: 14 }}>Task not found</div>

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', backgroundImage: 'radial-gradient(circle at 60% 10%, rgba(20,136,252,0.05) 0%, transparent 50%)' }}>
      {/* Top nav */}
      <div style={{ borderBottom: '1px solid #1a1a1a', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.4px' }}>Krufter</div>
        <button onClick={() => router.back()} style={{
          padding: '6px 14px', background: 'transparent',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999,
          cursor: 'pointer', fontSize: 12, color: '#5a5a5a', fontFamily: 'inherit',
        }}>← Back to tasks</button>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px' }}>
        {/* Task info */}
        <div style={{
          background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '24px 26px', marginBottom: 20,
          boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                {task.projects?.name} {task.projects?.client_name ? `· ${task.projects.client_name}` : ''}
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.4px' }}>
                {task.title}
              </h1>
            </div>
            <span style={{
              fontSize: 11, padding: '4px 12px', borderRadius: 999,
              background: `${urgencyColors[task.urgency]}15`,
              color: urgencyColors[task.urgency],
              border: `1px solid ${urgencyColors[task.urgency]}30`,
              textTransform: 'capitalize', flexShrink: 0, marginLeft: 16,
            }}>{task.urgency}</span>
          </div>

          {task.description && (
            <p style={{ fontSize: 14, color: '#8a8a8f', lineHeight: 1.6, marginBottom: 14 }}>
              {task.description}
            </p>
          )}

          {task.notes && (
            <div style={{
              padding: '12px 14px', background: '#141416',
              borderRadius: 8, borderLeft: '3px solid #2a2a2a',
              fontSize: 13, color: '#6a6a6f', marginBottom: 14, lineHeight: 1.5,
            }}>
              📝 {task.notes}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: '#4a4a4a' }}>
              {task.due_date ? `Due ${new Date(task.due_date).toLocaleDateString()}` : 'No deadline set'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#5a5a5a' }}>Status:</span>
              <select
                value={task.status}
                onChange={e => updateStatus(e.target.value)}
                style={{
                  background: '#141416',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, padding: '6px 10px',
                  color: '#e8e8e8', fontSize: 13,
                  cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                }}
              >
                {['todo', 'in_progress', 'review', 'done'].map(s => (
                  <option key={s} value={s} style={{ background: '#1e1e22' }}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submit deliverable */}
        <div style={{
          background: '#1e1e22', border: '1px solid rgba(20,136,252,0.15)',
          borderRadius: 14, padding: '24px 26px', marginBottom: 20,
          boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 18 }}>
            Submit Work
          </div>

          {/* Type toggle */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#141416', borderRadius: 999, padding: 4, width: 'fit-content' }}>
            {(['link', 'note'] as const).map(t => (
              <button key={t} onClick={() => setType(t)} style={{
                padding: '6px 16px', borderRadius: 999,
                background: type === t ? '#1488fc' : 'transparent',
                border: 'none', cursor: 'pointer',
                fontSize: 13, color: type === t ? '#fff' : '#5a5a5a',
                fontFamily: 'inherit', textTransform: 'capitalize',
              }}>{t === 'link' ? '🔗 Link / Doc' : '📝 Note'}</button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>{lbl('Title / Description')}<input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder={type === 'link' ? 'e.g. Final article draft' : 'e.g. Update notes'} /></div>
            {type === 'link' ? (
              <div>{lbl('URL (Google Doc, Drive, etc.)')}<input style={inputStyle} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://docs.google.com/..." /></div>
            ) : (
              <div>{lbl('Note')}<textarea style={{ ...inputStyle, height: 100, resize: 'vertical' }} value={content} onChange={e => setContent(e.target.value)} placeholder="Write your update here..." /></div>
            )}
            <button onClick={submitDeliverable} disabled={submitting} style={{
              padding: '11px 24px', background: '#1488fc', border: 'none', borderRadius: 999,
              boxShadow: '0 0 20px rgba(20,136,252,0.3)',
              cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#fff',
              fontFamily: 'inherit', alignSelf: 'flex-start',
            }}>{submitting ? 'Submitting...' : 'Submit'}</button>
          </div>
        </div>

        {/* Previous deliverables */}
        {deliverables.length > 0 && (
          <div style={{
            background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, padding: '24px 26px',
            boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16 }}>
              Submitted Work ({deliverables.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {deliverables.map((d: any) => (
                <div key={d.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '12px 14px', background: '#141416', borderRadius: 10,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', marginBottom: 4 }}>
                      {d.title}
                    </div>
                    {d.url && (
                      <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#1488fc', wordBreak: 'break-all' }}>
                        {d.url}
                      </a>
                    )}
                    {d.content && (
                      <div style={{ fontSize: 12, color: '#6a6a6f', lineHeight: 1.5, marginTop: 4 }}>
                        {d.content}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: '#3a3a3a', marginTop: 6 }}>
                      {new Date(d.created_at).toLocaleString()}
                    </div>
                  </div>
                  <button onClick={() => deleteDeliverable(d.id)} style={{
                    marginLeft: 12, padding: '4px 8px', background: 'transparent',
                    border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6,
                    cursor: 'pointer', fontSize: 11, color: '#f87171', fontFamily: 'inherit',
                    flexShrink: 0,
                  }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}