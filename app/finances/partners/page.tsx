'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const inputStyle = {
  background: '#141416', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, padding: '10px 14px', color: '#e8e8e8',
  fontSize: 14, width: '100%', outline: 'none', fontFamily: 'inherit',
}

const lbl = (t: string, sub?: string) => (
  <div style={{ marginBottom: 7 }}>
    <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>{t}</div>
    {sub && <div style={{ fontSize: 11, color: '#3a3a3a', marginTop: 1 }}>{sub}</div>}
  </div>
)

export default function PartnersPage() {
  const [partners, setPartners] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [revenueShare, setRevenueShare] = useState(14)
  const [equityPct, setEquityPct] = useState(0)
  const [perProject, setPerProject] = useState(true)
  const [notes, setNotes] = useState('')

  useEffect(() => { fetchPartners() }, [])

  const fetchPartners = async () => {
    const { data } = await supabase.from('partners').select('*').order('created_at')
    setPartners(data ?? [])
  }

  const resetForm = () => {
    setName(''); setEmail(''); setRevenueShare(14)
    setEquityPct(0); setPerProject(true); setNotes('')
    setEditId(null); setShowForm(false)
  }

  const save = async () => {
    if (!name) return alert('Partner name required')
    setSaving(true)
    const payload = {
      name, email,
      revenue_share_pct: revenueShare,
      equity_pct: equityPct,
      per_project: perProject,
      notes, active: true,
    }

    if (editId) {
      await supabase.from('partners').update(payload).eq('id', editId)
    } else {
      await supabase.from('partners').insert(payload)
    }

    setSaving(false)
    resetForm()
    fetchPartners()
  }

  const startEdit = (p: any) => {
    setEditId(p.id); setName(p.name); setEmail(p.email ?? '')
    setRevenueShare(p.revenue_share_pct); setEquityPct(p.equity_pct)
    setPerProject(p.per_project); setNotes(p.notes ?? '')
    setShowForm(true)
  }

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('partners').update({ active: !active }).eq('id', id)
    fetchPartners()
  }

  // Live preview
  const exampleGross = 1000
  const exampleAfterPlatform = exampleGross * 0.85
  const partnerCutExample = exampleAfterPlatform * (revenueShare / 100)

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>Partners</h1>
          <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 6 }}>Revenue share and equity configuration.</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} style={{
          padding: '9px 20px', background: '#1488fc', border: 'none', borderRadius: 999,
          boxShadow: '0 0 20px rgba(20,136,252,0.3)',
          cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#fff', fontFamily: 'inherit',
        }}>+ Add Partner</button>
      </div>

      {showForm && (
        <div style={{
          background: '#1e1e22', border: '1px solid rgba(20,136,252,0.2)',
          borderRadius: 12, padding: 24, marginBottom: 20,
          boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 18 }}>
            {editId ? 'Edit Partner' : 'New Partner'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>{lbl('Name *')}<input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="US Partner" /></div>
            <div>{lbl('Email')}<input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="partner@email.com" /></div>
            <div>{lbl('Revenue Share (%)', 'Applied after platform fee')}
              <input style={inputStyle} type="number" value={revenueShare} onChange={e => setRevenueShare(Number(e.target.value))} min={0} max={100} />
              <div style={{ fontSize: 11, color: '#4a4a4a', marginTop: 5 }}>
                On $1,000 project (after 15% Upwork): partner gets ${partnerCutExample.toFixed(0)}
              </div>
            </div>
            <div>{lbl('Equity % (informational)', 'Not used in calculations')}<input style={inputStyle} type="number" value={equityPct} onChange={e => setEquityPct(Number(e.target.value))} min={0} max={100} /></div>
            <div style={{ gridColumn: '1 / -1' }}>{lbl('Notes')}<input style={inputStyle} value={notes} onChange={e => setNotes(e.target.value)} placeholder="US access, payment enablement, etc." /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#8a8a8f' }}>
                <input type="checkbox" checked={perProject} onChange={e => setPerProject(e.target.checked)} style={{ width: 14, height: 14, cursor: 'pointer' }} />
                Apply per project (not global)
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={save} disabled={saving} style={{
              padding: '10px 20px', background: '#1488fc', border: 'none', borderRadius: 999,
              cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#fff', fontFamily: 'inherit',
            }}>{saving ? 'Saving...' : editId ? 'Update' : 'Save'}</button>
            <button onClick={resetForm} style={{
              padding: '10px 20px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999,
              cursor: 'pointer', fontSize: 13, color: '#5a5a5a', fontFamily: 'inherit',
            }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {partners.length === 0 ? (
          <div style={{
            background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, textAlign: 'center', padding: '60px 20px',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🤝</div>
            <p style={{ fontSize: 14, color: '#5a5a5a' }}>No partners yet</p>
          </div>
        ) : partners.map(p => (
          <div key={p.id} style={{
            background: '#1e1e22',
            border: `1px solid ${p.active ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)'}`,
            borderRadius: 12, padding: '18px 22px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            opacity: p.active ? 1 : 0.5,
            boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{p.name}</div>
                {!p.active && <span style={{ fontSize: 10, color: '#4a4a4a', padding: '2px 8px', background: '#1a1a1a', borderRadius: 999 }}>Inactive</span>}
              </div>
              {p.email && <div style={{ fontSize: 12, color: '#4a4a4a', marginBottom: 6 }}>{p.email}</div>}
              <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#5a5a5a' }}>
                <span>Revenue share: <strong style={{ color: '#fbbf24' }}>{p.revenue_share_pct}%</strong></span>
                {p.equity_pct > 0 && <span>Equity: <strong style={{ color: '#818cf8' }}>{p.equity_pct}%</strong></span>}
                <span>{p.per_project ? 'Per project' : 'Global'}</span>
              </div>
              {p.notes && <div style={{ fontSize: 12, color: '#4a4a4a', marginTop: 6 }}>{p.notes}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => startEdit(p)} style={{
                padding: '6px 14px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999,
                cursor: 'pointer', fontSize: 12, color: '#8a8a8f', fontFamily: 'inherit',
              }}>Edit</button>
              <button onClick={() => toggleActive(p.id, p.active)} style={{
                padding: '6px 14px', background: 'transparent',
                border: `1px solid ${p.active ? 'rgba(248,113,113,0.2)' : 'rgba(74,222,128,0.2)'}`,
                borderRadius: 999, cursor: 'pointer',
                fontSize: 12, color: p.active ? '#f87171' : '#4ade80', fontFamily: 'inherit',
              }}>{p.active ? 'Deactivate' : 'Activate'}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}