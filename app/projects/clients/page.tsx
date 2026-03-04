'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const inputStyle = {
  background: '#141416', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, padding: '10px 14px', color: '#e8e8e8',
  fontSize: 14, width: '100%', outline: 'none', fontFamily: 'inherit',
}

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [platform, setPlatform] = useState('Direct')
  const [isRecurring, setIsRecurring] = useState(false)
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  useEffect(() => { fetchClients() }, [])

  const fetchClients = async () => {
    const { data } = await supabase.from('pm_clients').select('*').order('name')
    setClients(data ?? [])
  }

  const save = async () => {
    if (!name) return alert('Client name required')
    setSaving(true)
    await supabase.from('pm_clients').insert({ name, platform, is_recurring: isRecurring, notes: notes || null })
    setName(''); setPlatform('Direct'); setIsRecurring(false); setNotes('')
    setSaving(false); setShowForm(false)
    fetchClients()
  }

  const deleteClient = async (id: string, name: string) => {
    if (!confirm(`Delete client "${name}"?`)) return
    await supabase.from('pm_clients').delete().eq('id', id)
    fetchClients()
  }

  const platformColors: Record<string, string> = {
    Upwork: '#14a800', Direct: '#1488fc', Partner: '#818cf8', Other: '#5a5a5a'
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <Link href="/projects" style={{ fontSize: 13, color: '#5a5a5a', display: 'block', marginBottom: 8 }}>← Work View</Link>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>Clients</h1>
          <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 6 }}>{clients.length} clients</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          marginTop: 28, padding: '9px 20px', background: '#1488fc', border: 'none', borderRadius: 999,
          boxShadow: '0 0 20px rgba(20,136,252,0.3)',
          cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#fff', fontFamily: 'inherit',
        }}>+ Add Client</button>
      </div>

      {showForm && (
        <div style={{
          background: '#1e1e22', border: '1px solid rgba(20,136,252,0.2)',
          borderRadius: 12, padding: 22, marginBottom: 16,
          boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 7 }}>Client Name *</div>
              <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Acme Corp" autoFocus />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 7 }}>Platform</div>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={platform} onChange={e => setPlatform(e.target.value)}>
                {['Upwork', 'Direct', 'Partner', 'Other'].map(p => (
                  <option key={p} value={p} style={{ background: '#1e1e22' }}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#8a8a8f' }}>
              <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} />
              Recurring client
            </label>
            <button onClick={() => setShowNotes(!showNotes)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#4a4a4a', fontFamily: 'inherit' }}>
              {showNotes ? 'Hide notes' : '+ Add notes'}
            </button>
          </div>
          {showNotes && (
            <textarea
              style={{ ...inputStyle, height: 70, resize: 'vertical' as const, marginBottom: 14 }}
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Any notes about this client..."
            />
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={save} disabled={saving} style={{
              padding: '10px 20px', background: '#1488fc', border: 'none', borderRadius: 999,
              cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#fff', fontFamily: 'inherit',
            }}>{saving ? 'Saving...' : 'Save Client'}</button>
            <button onClick={() => setShowForm(false)} style={{
              padding: '10px 20px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999,
              cursor: 'pointer', fontSize: 13, color: '#5a5a5a', fontFamily: 'inherit',
            }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{
        background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
      }}>
        {clients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👤</div>
            <p style={{ fontSize: 14, color: '#5a5a5a' }}>No clients yet</p>
          </div>
        ) : clients.map((c, i) => (
          <div key={c.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 20px',
            borderBottom: i < clients.length - 1 ? '1px solid #1a1a1a' : 'none',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{c.name}</span>
                {c.is_recurring && (
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(129,140,248,0.1)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.2)' }}>
                    ↻ Recurring
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: platformColors[c.platform] ?? '#5a5a5a' }}>{c.platform}</span>
                {c.notes && <span style={{ fontSize: 11, color: '#3a3a3a' }}>· has notes</span>}
              </div>
            </div>
            <button onClick={() => deleteClient(c.id, c.name)} style={{
              padding: '5px 12px', background: 'transparent',
              border: '1px solid rgba(248,113,113,0.2)', borderRadius: 999,
              cursor: 'pointer', fontSize: 12, color: '#f87171', fontFamily: 'inherit',
            }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}