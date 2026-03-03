'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const categories = [
  { value: 'fixed', label: 'Fixed', color: '#818cf8' },
  { value: 'variable_delivery', label: 'Variable Delivery', color: '#fbbf24' },
  { value: 'platform_fee', label: 'Platform Fee', color: '#f87171' },
  { value: 'partner_payout', label: 'Partner Payout', color: '#a78bfa' },
  { value: 'transfer_fee', label: 'Transfer Fee', color: '#f87171' },
  { value: 'misc_ops', label: 'Misc Ops', color: '#5a5a5a' },
]

const inputStyle = {
  background: '#141416', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, padding: '10px 14px', color: '#e8e8e8',
  fontSize: 14, width: '100%', outline: 'none', fontFamily: 'inherit',
}

const lbl = (t: string) => (
  <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 7 }}>{t}</div>
)

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterCat, setFilterCat] = useState('all')

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('PKR')
  const [category, setCategory] = useState('fixed')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrence, setRecurrence] = useState('monthly')
  const [projectId, setProjectId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchExpenses()
    fetchProjects()
  }, [])

  const fetchExpenses = async () => {
    const { data } = await supabase
      .from('classified_expenses')
      .select('*, financial_projects(name)')
      .order('date', { ascending: false })
    setExpenses(data ?? [])
  }

  const fetchProjects = async () => {
    const { data } = await supabase.from('financial_projects').select('id, name').eq('status', 'active')
    setProjects(data ?? [])
  }

  const save = async () => {
    if (!description || !amount) return alert('Description and amount required')
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('classified_expenses').insert({
      description, amount: parseFloat(amount), currency, category,
      is_recurring: isRecurring,
      recurrence: isRecurring ? recurrence : null,
      project_id: projectId || null,
      date, notes,
      created_by: user?.id,
    })

    if (error) { alert(error.message); setSaving(false); return }

    await supabase.from('activity_log').insert({
      user_id: user?.id,
      action: 'logged_expense',
      details: `Logged ${category} expense: ${currency === 'PKR' ? '₨' : '$'}${amount} — ${description}`,
    })

    setDescription(''); setAmount(''); setCategory('fixed')
    setIsRecurring(false); setProjectId(''); setNotes('')
    setSaving(false)
    setShowForm(false)
    fetchExpenses()
  }

  const deleteExpense = async (id: string, desc: string) => {
    if (!confirm(`Delete "${desc}"?`)) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('classified_expenses').delete().eq('id', id)
    await supabase.from('activity_log').insert({
      user_id: user?.id,
      action: 'deleted_expense',
      details: `Deleted expense: ${desc}`,
    })
    fetchExpenses()
  }

  const filtered = filterCat === 'all' ? expenses : expenses.filter(e => e.category === filterCat)
  const totalPKR = expenses.filter(e => e.currency === 'PKR').reduce((s, e) => s + Number(e.amount), 0)
  const totalUSD = expenses.filter(e => e.currency === 'USD').reduce((s, e) => s + Number(e.amount), 0)
  const fixedMonthly = expenses.filter(e => e.category === 'fixed' && e.is_recurring).reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>Expenses</h1>
          <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 6 }}>
            ₨{totalPKR.toLocaleString()} PKR · ${totalUSD.toLocaleString()} USD · ₨{fixedMonthly.toLocaleString()} fixed/month
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: '9px 20px', background: '#1488fc', border: 'none', borderRadius: 999,
          boxShadow: '0 0 20px rgba(20,136,252,0.3)',
          cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#fff', fontFamily: 'inherit',
        }}>+ Log Expense</button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: '#1e1e22', border: '1px solid rgba(20,136,252,0.2)',
          borderRadius: 12, padding: 24, marginBottom: 20,
          boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 18 }}>New Expense</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              {lbl('Description *')}
              <input style={inputStyle} value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Office rent March" />
            </div>
            <div>
              {lbl('Amount *')}
              <input style={inputStyle} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
            </div>
            <div>
              {lbl('Currency')}
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="PKR" style={{ background: '#1e1e22' }}>PKR</option>
                <option value="USD" style={{ background: '#1e1e22' }}>USD</option>
              </select>
            </div>
            <div>
              {lbl('Category')}
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={category} onChange={e => setCategory(e.target.value)}>
                {categories.map(c => <option key={c.value} value={c.value} style={{ background: '#1e1e22' }}>{c.label}</option>)}
              </select>
            </div>
            <div>
              {lbl('Date')}
              <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              {lbl('Link to Project (optional)')}
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={projectId} onChange={e => setProjectId(e.target.value)}>
                <option value="">Global (not project-specific)</option>
                {projects.map(p => <option key={p.id} value={p.id} style={{ background: '#1e1e22' }}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#8a8a8f' }}>
                <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)}
                  style={{ width: 14, height: 14, cursor: 'pointer' }} />
                Recurring expense
              </label>
              {isRecurring && (
                <select style={{ ...inputStyle, width: 'auto', padding: '6px 10px', fontSize: 12 }} value={recurrence} onChange={e => setRecurrence(e.target.value)}>
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                </select>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={save} disabled={saving} style={{
              padding: '10px 20px', background: '#1488fc', border: 'none', borderRadius: 999,
              cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#fff', fontFamily: 'inherit',
            }}>{saving ? 'Saving...' : 'Save Expense'}</button>
            <button onClick={() => setShowForm(false)} style={{
              padding: '10px 20px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999,
              cursor: 'pointer', fontSize: 13, color: '#5a5a5a', fontFamily: 'inherit',
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {[{ value: 'all', label: 'All', color: '#fff' }, ...categories].map(c => (
          <button key={c.value} onClick={() => setFilterCat(c.value)} style={{
            padding: '5px 14px', borderRadius: 999,
            background: filterCat === c.value ? 'rgba(255,255,255,0.08)' : 'transparent',
            border: `1px solid ${filterCat === c.value ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
            cursor: 'pointer', fontSize: 12,
            color: filterCat === c.value ? '#fff' : '#5a5a5a',
            fontFamily: 'inherit',
          }}>{c.label}</button>
        ))}
      </div>

      {/* List */}
      <div style={{
        background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
      }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>💸</div>
            <p style={{ fontSize: 14, color: '#5a5a5a' }}>No expenses logged yet</p>
          </div>
        ) : filtered.map((item, i) => {
          const cat = categories.find(c => c.value === item.category)
          return (
            <div key={item.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '13px 20px',
              borderBottom: i < filtered.length - 1 ? '1px solid #1a1a1a' : 'none',
            }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: cat?.color ?? '#5a5a5a',
                }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', marginBottom: 3 }}>
                    {item.description}
                    {item.is_recurring && (
                      <span style={{ fontSize: 10, marginLeft: 8, color: '#4a4a4a' }}>↻ {item.recurrence}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#4a4a4a' }}>
                    {cat?.label ?? item.category}
                    {item.financial_projects?.name ? ` · ${item.financial_projects.name}` : ' · Global'}
                    {' · '}{new Date(item.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                  {item.currency === 'PKR' ? '₨' : '$'}{Number(item.amount).toLocaleString()}
                </div>
                <button onClick={() => deleteExpense(item.id, item.description)} style={{
                  padding: '4px 10px', background: 'transparent',
                  border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6,
                  cursor: 'pointer', fontSize: 12, color: '#f87171', fontFamily: 'inherit',
                }}>Delete</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}