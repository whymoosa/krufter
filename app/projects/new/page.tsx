'use client'
import { useState, useEffect } from 'react'
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

const serviceTypes = ['Content Writing', 'SEO', 'Web Development', 'White-label', 'Consulting', 'Other']

export default function NewProject() {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [financeProjects, setFinanceProjects] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])

  const [name, setName] = useState('')
  const [clientId, setClientId] = useState('')
  const [serviceType, setServiceType] = useState('Content Writing')
  const [projectType, setProjectType] = useState('one_time')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [isOngoing, setIsOngoing] = useState(false)
  const [status, setStatus] = useState('active')
  const [priority, setPriority] = useState('normal')
  const [financeProjectId, setFinanceProjectId] = useState('')
  const [saving, setSaving] = useState(false)

  // Milestone template for recurring
  const [templateMilestones, setTemplateMilestones] = useState<{ name: string; assigned_to: string }[]>([])
  const [tmName, setTmName] = useState('')
  const [tmAssigned, setTmAssigned] = useState('')

  // Initial milestones for one-time
  const [milestones, setMilestones] = useState<{ name: string; due_date: string; assigned_to: string }[]>([])
  const [msName, setMsName] = useState('')
  const [msDue, setMsDue] = useState('')
  const [msAssigned, setMsAssigned] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('pm_clients').select('id, name').order('name'),
      supabase.from('financial_projects').select('id, name').order('name'),
      supabase.from('profiles').select('id, full_name, email'),
    ]).then(([{ data: c }, { data: f }, { data: p }]) => {
      setClients(c ?? [])
      setFinanceProjects(f ?? [])
      setProfiles(p ?? [])
    })
  }, [])

  const addTemplateMilestone = () => {
    if (!tmName) return
    setTemplateMilestones(prev => [...prev, { name: tmName, assigned_to: tmAssigned }])
    setTmName(''); setTmAssigned('')
  }

  const addMilestone = () => {
    if (!msName) return
    setMilestones(prev => [...prev, { name: msName, due_date: msDue, assigned_to: msAssigned }])
    setMsName(''); setMsDue(''); setMsAssigned('')
  }

  const save = async () => {
    if (!name) return alert('Project name required')
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: project, error } = await supabase.from('pm_projects').insert({
      name,
      client_id: clientId || null,
      service_type: serviceType,
      project_type: projectType,
      start_date: startDate || null,
      end_date: isOngoing ? null : endDate || null,
      is_ongoing: isOngoing,
      status, priority,
      finance_project_id: financeProjectId || null,
    }).select().single()

    if (error || !project) { alert(error?.message); setSaving(false); return }

    // Save milestone templates for recurring
    if (projectType === 'recurring' && templateMilestones.length > 0) {
      await supabase.from('milestone_templates').insert(
        templateMilestones.map(t => ({
          project_id: project.id,
          name: t.name,
          assigned_to: t.assigned_to || null,
        }))
      )
      // Auto-generate first milestone for this month
      const dueDate = new Date()
      dueDate.setDate(28)
      await supabase.from('pm_milestones').insert(
        templateMilestones.map(t => ({
          project_id: project.id,
          name: t.name,
          due_date: dueDate.toISOString().split('T')[0],
          assigned_to: t.assigned_to || null,
          status: 'not_started',
          is_generated: true,
        }))
      )
    }

    // Save milestones for one-time
    if (projectType === 'one_time' && milestones.length > 0) {
      await supabase.from('pm_milestones').insert(
        milestones.map(m => ({
          project_id: project.id,
          name: m.name,
          due_date: m.due_date || null,
          assigned_to: m.assigned_to || null,
          status: 'not_started',
        }))
      )
    }

    await supabase.from('activity_log').insert({
      user_id: user?.id,
      action: 'created_project',
      details: `Created project "${name}"`,
    })

    router.push('/projects')
  }

  const profileName = (p: any) => p.full_name || p.email?.split('@')[0] || p.email

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>New Project</h1>
        <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 6 }}>Set up once, track forever.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Basic info */}
        <div style={{
          background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: 24, boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 18 }}>Project Info</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                {lbl('Project Name *')}
                <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Monthly Blog Batch" />
              </div>
              <div>
                {lbl('Client')}
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={clientId} onChange={e => setClientId(e.target.value)}>
                  <option value="">No client</option>
                  {clients.map(c => <option key={c.id} value={c.id} style={{ background: '#1e1e22' }}>{c.name}</option>)}
                </select>
              </div>
              <div>
                {lbl('Service Type')}
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={serviceType} onChange={e => setServiceType(e.target.value)}>
                  {serviceTypes.map(s => <option key={s} value={s} style={{ background: '#1e1e22' }}>{s}</option>)}
                </select>
              </div>
              <div>
                {lbl('Project Type')}
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={projectType} onChange={e => setProjectType(e.target.value)}>
                  <option value="one_time" style={{ background: '#1e1e22' }}>One-time</option>
                  <option value="recurring" style={{ background: '#1e1e22' }}>Recurring (Monthly)</option>
                </select>
              </div>
              <div>
                {lbl('Priority')}
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={priority} onChange={e => setPriority(e.target.value)}>
                  <option value="normal" style={{ background: '#1e1e22' }}>Normal</option>
                  <option value="high" style={{ background: '#1e1e22' }}>High</option>
                </select>
              </div>
              <div>
                {lbl('Link to Finance Project')}
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={financeProjectId} onChange={e => setFinanceProjectId(e.target.value)}>
                  <option value="">None</option>
                  {financeProjects.map(f => <option key={f.id} value={f.id} style={{ background: '#1e1e22' }}>{f.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>{lbl('Start Date')}<input style={inputStyle} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
              <div>
                {lbl('End Date')}
                <input style={{ ...inputStyle, opacity: isOngoing ? 0.4 : 1 }} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={isOngoing} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, cursor: 'pointer', fontSize: 12, color: '#5a5a5a' }}>
                  <input type="checkbox" checked={isOngoing} onChange={e => setIsOngoing(e.target.checked)} />
                  Ongoing
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div style={{
          background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: 24, boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
            {projectType === 'recurring' ? 'Milestone Template' : 'Milestones'}
          </div>
          <div style={{ fontSize: 12, color: '#4a4a4a', marginBottom: 18 }}>
            {projectType === 'recurring'
              ? 'Template is saved and first milestone is auto-generated.'
              : 'Add milestones for this project.'}
          </div>

          {projectType === 'recurring' ? (
            <>
              {templateMilestones.map((t, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: '#141416', borderRadius: 8, marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: '#e8e8e8' }}>{t.name}</span>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: '#5a5a5a' }}>{t.assigned_to ? profiles.find(p => p.id === t.assigned_to)?.full_name || '—' : '—'}</span>
                    <button onClick={() => setTemplateMilestones(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>✕</button>
                  </div>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10 }}>
                <input style={inputStyle} value={tmName} onChange={e => setTmName(e.target.value)} placeholder="Milestone name" onKeyDown={e => e.key === 'Enter' && addTemplateMilestone()} />
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={tmAssigned} onChange={e => setTmAssigned(e.target.value)}>
                  <option value="">Unassigned</option>
                  {profiles.map(p => <option key={p.id} value={p.id} style={{ background: '#1e1e22' }}>{profileName(p)}</option>)}
                </select>
                <button onClick={addTemplateMilestone} style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#8a8a8f', fontFamily: 'inherit' }}>Add</button>
              </div>
            </>
          ) : (
            <>
              {milestones.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: '#141416', borderRadius: 8, marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: '#e8e8e8' }}>{m.name}</span>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: '#5a5a5a' }}>{m.due_date || '—'}</span>
                    <span style={{ color: '#5a5a5a' }}>{m.assigned_to ? profiles.find(p => p.id === m.assigned_to)?.full_name || '—' : '—'}</span>
                    <button onClick={() => setMilestones(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>✕</button>
                  </div>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr auto', gap: 10 }}>
                <input style={inputStyle} value={msName} onChange={e => setMsName(e.target.value)} placeholder="Milestone name" onKeyDown={e => e.key === 'Enter' && addMilestone()} />
                <input style={inputStyle} type="date" value={msDue} onChange={e => setMsDue(e.target.value)} />
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={msAssigned} onChange={e => setMsAssigned(e.target.value)}>
                  <option value="">Unassigned</option>
                  {profiles.map(p => <option key={p.id} value={p.id} style={{ background: '#1e1e22' }}>{profileName(p)}</option>)}
                </select>
                <button onClick={addMilestone} style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#8a8a8f', fontFamily: 'inherit' }}>Add</button>
              </div>
            </>
          )}
        </div>

        <button onClick={save} disabled={saving || !name} style={{
          padding: '13px', background: '#1488fc', border: 'none', borderRadius: 999,
          boxShadow: '0 0 20px rgba(20,136,252,0.3)',
          cursor: saving || !name ? 'not-allowed' : 'pointer',
          fontSize: 14, fontWeight: 500, color: '#fff', fontFamily: 'inherit',
          opacity: !name ? 0.5 : 1,
        }}>{saving ? 'Saving...' : 'Create Project'}</button>
      </div>
    </div>
  )
}