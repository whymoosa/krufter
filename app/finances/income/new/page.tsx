'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const categories = ['Client Payment', 'Invoice', 'Upwork', 'Retainer', 'Bonus', 'Refund', 'Other']

const inputStyle = {
  background: '#141416', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, padding: '10px 14px', color: '#e8e8e8',
  fontSize: 14, width: '100%', outline: 'none', fontFamily: 'inherit',
}

const lbl = (t: string) => (
  <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 7 }}>{t}</div>
)

export default function IncomePage() {
  const router = useRouter()
  const [income, setIncome] = useState<any[]>([])
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Client Payment')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { fetchIncome() }, [])

  const fetchIncome = async () => {
    const { data } = await supabase
      .from('income').select('*').order('date', { ascending: false })
    setIncome(data ?? [])
  }

  const save = async () => {
    if (!amount) return alert('Please enter an amount')
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('income').insert({
      amount: parseFloat(amount), description, category, date
    })
    if (error) { alert('Error: ' + error.message); setSaving(false); return }

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: user?.id,
      action: 'logged_income',
      details: `Logged income: $${amount} — ${description || category}`,
    })

    setAmount(''); setDescription(''); setCategory('Client Payment')
    setDate(new Date().toISOString().split('T')[0])
    setSaving(false)
    setShowForm(false)
    fetchIncome()
  }

  const deleteIncome = async (id: string, amt: number) => {
    if (!confirm(`Delete this $${amt} income entry?`)) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('income').delete().eq('id', id)
    await supabase.from('activity_log').insert({
      user_id: user?.id,
      action: 'deleted_income',
      details: `Deleted income entry: $${amt}`,
    })
    fetchIncome()
  }

  const total = income.reduce((sum, i) => sum + Number(i.amount), 0)

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>Income</h1>
          <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 6 }}>
            Total: <span style={{ color: '#fff', fontWeight: 600 }}>${total.toLocaleString()}</span>
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: '9px 20px', background: '#1488fc', border: 'none', borderRadius: 999,
          boxShadow: '0 0 20px rgba(20,136,252,0.3)',
          cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#fff', fontFamily: 'inherit',
        }}>+ Log Income</button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: '#1e1e22', border: '1px solid rgba(20,136,252,0.2)',
          borderRadius: 12, padding: 24, marginBottom: 20,
          boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>{lbl('Amount ($) *')}<input style={inputStyle} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" /></div>
              <div>{lbl('Date')}<input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            </div>
            <div>{lbl('Description')}<input style={inputStyle} value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Payment from Acme Corp" /></div>
            <div>{lbl('Category')}
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={category} onChange={e => setCategory(e.target.value)}>
                {categories.map(c => <option key={c} value={c} style={{ background: '#1e1e22' }}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={save} disabled={saving} style={{
                padding: '10px 20px', background: '#1488fc', border: 'none', borderRadius: 999,
                cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#fff', fontFamily: 'inherit',
              }}>{saving ? 'Saving...' : 'Save Income'}</button>
              <button onClick={() => setShowForm(false)} style={{
                padding: '10px 20px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999,
                cursor: 'pointer', fontSize: 13, color: '#5a5a5a', fontFamily: 'inherit',
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div style={{
        background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
      }}>
        {income.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>💰</div>
            <p style={{ fontSize: 14, color: '#5a5a5a' }}>No income logged yet</p>
          </div>
        ) : income.map((item, i) => (
          <div key={item.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 20px',
            borderBottom: i < income.length - 1 ? '1px solid #1a1a1a' : 'none',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', marginBottom: 3 }}>
                {item.description || item.category}
              </div>
              <div style={{ fontSize: 11, color: '#4a4a4a' }}>
                {item.category} · {new Date(item.date).toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#4ade80' }}>
                +${Number(item.amount).toLocaleString()}
              </div>
              <button onClick={() => deleteIncome(item.id, item.amount)} style={{
                padding: '4px 10px', background: 'transparent',
                border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6,
                cursor: 'pointer', fontSize: 12, color: '#f87171', fontFamily: 'inherit',
              }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}