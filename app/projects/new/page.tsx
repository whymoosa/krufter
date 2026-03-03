'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const inputStyle = {
  background: '#141416', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, padding: '10px 14px', color: '#e8e8e8',
  fontSize: 14, width: '100%', outline: 'none', fontFamily: 'inherit',
}

const lbl = (t: string) => (
  <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 7 }}>{t}</div>
)

export default function NewProject() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [clientName, setClientName] = useState('')
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name) return alert('Project name is required')
    setSaving(true)
    const { error } = await supabase.from('projects').insert({
      name, description, client_name: clientName,
      deadline: deadline || null, status: 'active',
    })
    if (error) { alert('Error: ' + error.message); setSaving(false); return }
    router.push('/projects')
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>New Project</h1>
        <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 8 }}>Create a project and assign tasks to your team.</p>
      </div>
      <div style={{
        background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, padding: 28, boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div>{lbl('Project Name *')}<input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Website Redesign" /></div>
        <div>{lbl('Client Name')}<input style={inputStyle} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Acme Corp" /></div>
        <div>{lbl('Description')}<textarea style={{ ...inputStyle, height: 90, resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this project about?" /></div>
        <div>{lbl('Deadline')}<input style={inputStyle} type="date" value={deadline} onChange={e => setDeadline(e.target.value)} /></div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={save} disabled={saving} style={{
            padding: '11px 24px', background: '#1488fc', border: 'none', borderRadius: 999,
            boxShadow: '0 0 20px rgba(20,136,252,0.3)',
            cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#fff', fontFamily: 'inherit',
          }}>{saving ? 'Saving...' : 'Create Project'}</button>
          <button onClick={() => router.back()} style={{
            padding: '11px 24px', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999,
            cursor: 'pointer', fontSize: 13, color: '#5a5a5a', fontFamily: 'inherit',
          }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}