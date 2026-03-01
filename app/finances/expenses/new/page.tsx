'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const categories = ['Software', 'Marketing', 'Freelancer Pay', 'Equipment', 'Office', 'Travel', 'Taxes', 'Other']

const inputStyle = {
  background: '#141416', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, padding: '10px 14px', color: '#e8e8e8',
  fontSize: 14, width: '100%', outline: 'none', fontFamily: 'inherit',
}

const label = (t: string) => (
  <div style={{ fontSize: 11, color: '#4a4a4a', marginBottom: 7, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>{t}</div>
)

export default function NewExpense() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Other')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!amount) return alert('Please enter an amount')
    setSaving(true)
    const { error } = await supabase.from('expenses').insert({ amount: parseFloat(amount), description, category, date })
    if (error) { alert('Error: ' + error.message); setSaving(false); return }
    router.push('/finances')
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>Log Expense</h1>
        <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 8 }}>Record a business expense.</p>
      </div>
      <div style={{ background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 28, boxShadow: '0 2px 20px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>{label('Amount ($) *')}<input style={inputStyle} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" /></div>
        <div>{label('Description')}<input style={inputStyle} value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Figma subscription" /></div>
        <div>{label('Category')}
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(c => <option key={c} value={c} style={{ background: '#1e1e22' }}>{c}</option>)}
          </select>
        </div>
        <div>{label('Date')}<input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        <button onClick={save} disabled={saving} style={{
          marginTop: 8, padding: '12px',
          background: '#1488fc', border: 'none', borderRadius: 999,
          boxShadow: '0 0 20px rgba(20,136,252,0.3)',
          cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#fff',
          fontFamily: 'inherit',
        }}>{saving ? 'Saving...' : 'Save Expense'}</button>
      </div>
    </div>
  )
}