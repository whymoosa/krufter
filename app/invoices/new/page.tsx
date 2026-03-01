'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type LineItem = { description: string; quantity: number; rate: number }

export default function NewInvoice() {
  const router = useRouter()
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [taxRate, setTaxRate] = useState(0)
  const [saving, setSaving] = useState(false)
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, rate: 0 }
  ])

  const updateItem = (i: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems]
    updated[i] = { ...updated[i], [field]: value }
    setLineItems(updated)
  }

  const addItem = () => setLineItems([...lineItems, { description: '', quantity: 1, rate: 0 }])
  const removeItem = (i: number) => setLineItems(lineItems.filter((_, idx) => idx !== i))

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0)
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax

  const save = async (status: 'draft' | 'sent') => {
    if (!clientName) return alert('Please enter a client name')
    setSaving(true)
    const invoiceNumber = Date.now().toString().slice(-6)
    const { error } = await supabase.from('invoices').insert({
      invoice_number: invoiceNumber,
      client_name: clientName,
      client_email: clientEmail,
      line_items: lineItems,
      subtotal,
      tax_rate: taxRate,
      total,
      status,
      due_date: dueDate || null,
      notes,
    })
    if (error) { alert('Error saving: ' + error.message); setSaving(false); return }
    router.push('/invoices')
  }

  const input = {
    background: '#111827', border: '1px solid #1e2a3a', borderRadius: 8,
    padding: '10px 14px', color: '#e2e8f0', fontSize: 14, width: '100%',
    outline: 'none',
  }

  return (
    <div style={{ maxWidth: 780 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>New Invoice</h1>
        <p style={{ color: '#6b7280', marginTop: 6, fontSize: 14 }}>Fill in the details below.</p>
      </div>

      <div style={{ background: '#0d1220', border: '1px solid #1e2a3a', borderRadius: 14, padding: 28 }}>
        {/* Client Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 6 }}>CLIENT NAME *</label>
            <input style={input} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Acme Corp" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 6 }}>CLIENT EMAIL</label>
            <input style={input} value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@email.com" type="email" />
          </div>
        </div>

        {/* Line Items */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 10 }}>LINE ITEMS</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 40px', gap: 8, marginBottom: 8 }}>
            {['Description', 'Qty', 'Rate ($)', ''].map(h => (
              <div key={h} style={{ fontSize: 11, color: '#4b5563', padding: '0 4px' }}>{h}</div>
            ))}
          </div>
          {lineItems.map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 40px', gap: 8, marginBottom: 8 }}>
              <input style={input} value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Service description" />
              <input style={input} type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} min={1} />
              <input style={input} type="number" value={item.rate} onChange={e => updateItem(i, 'rate', Number(e.target.value))} min={0} />
              <button onClick={() => removeItem(i)} style={{
                background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: 8, color: '#f87171', cursor: 'pointer', fontSize: 16,
              }}>×</button>
            </div>
          ))}
          <button onClick={addItem} style={{
            marginTop: 8, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
            background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', color: '#818cf8',
          }}>+ Add Line Item</button>
        </div>

        {/* Totals + Meta */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 6 }}>DUE DATE</label>
              <input style={input} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 6 }}>TAX RATE (%)</label>
              <input style={input} type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} min={0} max={100} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 6 }}>NOTES</label>
              <textarea style={{ ...input, height: 80, resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payment terms, bank details, etc." />
            </div>
          </div>

          <div style={{ background: '#111827', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {[
                { label: 'Subtotal', value: `$${subtotal.toFixed(2)}` },
                { label: `Tax (${taxRate}%)`, value: `$${tax.toFixed(2)}` },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1e2a3a' }}>
                  <span style={{ color: '#6b7280', fontSize: 14 }}>{row.label}</span>
                  <span style={{ color: '#e2e8f0', fontSize: 14 }}>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0' }}>
                <span style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Total</span>
                <span style={{ color: '#34d399', fontSize: 24, fontWeight: 800 }}>${total.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              <button onClick={() => save('sent')} disabled={saving} style={{
                padding: '12px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14,
                background: 'linear-gradient(135deg, #22d3ee, #818cf8)', border: 'none', color: '#000',
              }}>{saving ? 'Saving...' : '✓ Save & Mark as Sent'}</button>
              <button onClick={() => save('draft')} disabled={saving} style={{
                padding: '12px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14,
                background: 'transparent', border: '1px solid #1e2a3a', color: '#6b7280',
              }}>{saving ? 'Saving...' : 'Save as Draft'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}