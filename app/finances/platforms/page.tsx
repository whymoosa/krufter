'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const inputStyle = {
  background: '#141416', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, padding: '10px 14px', color: '#e8e8e8',
  fontSize: 14, width: '100%', outline: 'none', fontFamily: 'inherit',
}

const lbl = (t: string) => (
  <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 7 }}>{t}</div>
)

export default function PlatformsPage() {
  const [platforms, setPlatforms] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [commissionPct, setCommissionPct] = useState(0)
  const [additionalFees, setAdditionalFees] = useState(0)
  const [payoutCycle, setPayoutCycle] = useState('weekly')
  const [currency, setCurrency] = useState('USD')
  const [notes, setNotes] = useState('')

  useEffect(() => { fetchPlatforms() }, [])

  const fetchPlatforms = async () => {
    const { data } = await supabase.from('platforms').select('*').order('created_at')
    setPlatforms(data ?? [])
  }

  const resetForm = () => {
    setName(''); setCommissionPct(0); setAdditionalFees(0)
    setPayoutCycle('weekly'); setCurrency('USD'); setNotes('')
    setEditId(null); setShowForm(false)
  }

  const save = async () => {
    if (!name) return alert('Platform name required')
    setSaving(true)
    const payload = {
      name, commission_pct: commissionPct,
      additional_fees: additionalFees,
      payout_cycle: payoutCycle, currency, notes,
    }
    if (editId) {
      await supabase.from('platforms').update(payload).eq('id', editId)
    } else {
      await supabase.from('platforms').insert(payload)
    }
    setSaving(false)
    resetForm()
    fetchPlatforms()
  }

  const startEdit = (p: any) => {
    setEditId(p.id); setName(p.name)
    setCommissionPct(p.commission_pct); setAdditionalFees(p.additional_fees)
    setPayoutCycle(p.payout_cycle); setCurrency(p.currency); setNotes(p.notes ?? '')
    setShowForm(true)
  }

  const deletePlatform = async (id: string, pname: string) => {
    if (!confirm(`Delete platform "${pname}"?`)) return
    await supabase.from('platforms').delete().eq('id', id)
    fetchPlatforms()
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>Platforms</h1>
          <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 6 }}>Fee rules engine — configure once, applied everywhere.</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} style={{
          padding: '9px 20px', background: '#1488fc', border: 'none', borderRadius: 999,
          boxShadow: '0 0 20px rgba(20,136,252,0.3)',
          cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#fff', fontFamily: 'inherit',
        }}>+ Add Platform</button>
      </div>

      {showForm && (
        <div style={{
          background: '#1e1e22', border: '1px solid rgba(20,136,252,0.2)',
          borderRadius: 12, padding: 24, marginBottom: 20,
          boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 18 }}>
            {editId ? 'Edit Platform' : 'New Platform'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              {lbl('Platform Name *')}
              <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Upwork" />
            </div>
            <div>
              {lbl('Commission (%)')}
              <input style={inputStyle} type="number" value={commissionPct} onChange={e => setCommissionPct(Number(e.target.value))} min={0} max={100} />
            </div>
            <div>
              {lbl('Additional Fees (USD)')}
              <input style={inputStyle} type="number" value={additionalFees} onChange={e => setAdditionalFees(Number(e.target.value))} min={0} />
            </div>
            <div>
              {lbl('Payout Cycle')}
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={payoutCycle} onChange={e => setPayoutCycle(e.target.value)}>
                {['weekly', 'biweekly', 'monthly', 'immediate'].map(c => (
                  <option key={c} value={c} style={{ background: '#1e1e22' }}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              {lbl('Currency')}
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={currency} onChange={e => setCurrency(e.target.value)}>
                {['USD', 'PKR', 'GBP', 'EUR'].map(c => (
                  <option key={c} value={c} style={{ background: '#1e1e22' }}>{c}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              {lbl('Notes')}
              <input style={inputStyle} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special rules for this platform..." />
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
        {platforms.length === 0 ? (
          <div style={{
            background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, textAlign: 'center', padding: '60px 20px',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚙️</div>
            <p style={{ fontSize: 14, color: '#5a5a5a' }}>No platforms configured yet</p>
          </div>
        ) : platforms.map(p => (
          <div key={p.id} style={{
            background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '18px 22px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 6 }}>{p.name}</div>
              <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#5a5a5a' }}>
                <span>Commission: <strong style={{ color: '#e8e8e8' }}>{p.commission_pct}%</strong></span>
                <span>Extra fees: <strong style={{ color: '#e8e8e8' }}>${p.additional_fees}</strong></span>
                <span>Payout: <strong style={{ color: '#e8e8e8' }}>{p.payout_cycle}</strong></span>
                <span>Currency: <strong style={{ color: '#e8e8e8' }}>{p.currency}</strong></span>
              </div>
              {p.notes && <div style={{ fontSize: 12, color: '#4a4a4a', marginTop: 6 }}>{p.notes}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => startEdit(p)} style={{
                padding: '6px 14px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999,
                cursor: 'pointer', fontSize: 12, color: '#8a8a8f', fontFamily: 'inherit',
              }}>Edit</button>
              <button onClick={() => deletePlatform(p.id, p.name)} style={{
                padding: '6px 14px', background: 'transparent',
                border: '1px solid rgba(248,113,113,0.2)', borderRadius: 999,
                cursor: 'pointer', fontSize: 12, color: '#f87171', fontFamily: 'inherit',
              }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}