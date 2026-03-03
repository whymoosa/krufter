'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

export default function NewFinancialProject() {
  const router = useRouter()
  const [platforms, setPlatforms] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [serviceTypes, setServiceTypes] = useState<any[]>([])

  const [name, setName] = useState('')
  const [clientName, setClientName] = useState('')
  const [platformId, setPlatformId] = useState('')
  const [partnerId, setPartnerId] = useState('')
  const [serviceTypeId, setServiceTypeId] = useState('')
  const [grossValue, setGrossValue] = useState(0)
  const [deliveryCost, setDeliveryCost] = useState(0)
  const [transferFee, setTransferFee] = useState(25)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchOptions() }, [])

  const fetchOptions = async () => {
    const [{ data: plat }, { data: part }, { data: svc }] = await Promise.all([
      supabase.from('platforms').select('*'),
      supabase.from('partners').select('*').eq('active', true),
      supabase.from('service_types').select('*'),
    ])
    setPlatforms(plat ?? [])
    setPartners(part ?? [])
    setServiceTypes(svc ?? [])
    if (plat?.[0]) setPlatformId(plat[0].id)
    if (svc?.[0]) setServiceTypeId(svc[0].id)
  }

  // Live calculations
  const selectedPlatform = platforms.find(p => p.id === platformId)
  const selectedPartner = partners.find(p => p.id === partnerId)

  const platform_fee = grossValue * ((selectedPlatform?.commission_pct ?? 0) / 100)
  const after_platform = grossValue - platform_fee
  const partner_cut = after_platform * ((selectedPartner?.revenue_share_pct ?? 0) / 100)
  const charity = after_platform * 0.15
  const after_structural = after_platform - partner_cut - charity - transferFee
  const net_profit = after_structural - deliveryCost
  const margin_pct = grossValue > 0 ? (net_profit / grossValue) * 100 : 0

  const save = async () => {
    if (!name || !grossValue) return alert('Project name and gross value required')
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('financial_projects').insert({
      name, client_name: clientName,
      platform_id: platformId || null,
      partner_id: partnerId || null,
      service_type_id: serviceTypeId || null,
      gross_value: grossValue,
      delivery_cost: deliveryCost,
      transfer_fee: transferFee,
      start_date: startDate || null,
      end_date: endDate || null,
      notes, status: 'active',
    })

    if (error) { alert(error.message); setSaving(false); return }

    await supabase.from('activity_log').insert({
      user_id: user?.id,
      action: 'created_financial_project',
      details: `Created project "${name}" — $${grossValue} gross, $${net_profit.toFixed(0)} net profit`,
    })

    router.push('/finances/projects')
  }

  const deductions = [
    { label: `Platform fee (${selectedPlatform?.commission_pct ?? 0}%)`, value: platform_fee, color: '#f87171' },
    { label: `Partner cut (${selectedPartner?.revenue_share_pct ?? 0}%)`, value: partner_cut, color: '#f87171' },
    { label: 'Charity (15%)', value: charity, color: '#f87171' },
    { label: 'Transfer fee', value: transferFee, color: '#fbbf24' },
    { label: 'Delivery costs', value: deliveryCost, color: '#fbbf24' },
  ]

  return (
    <div style={{ maxWidth: 940 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>New Financial Project</h1>
        <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 6 }}>Track real profit from day one.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        {/* Left — inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Basic info */}
          <div style={{
            background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: 24, boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 18 }}>Project Info</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>{lbl('Project Name *')}<input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Website Redesign" /></div>
                <div>{lbl('Client Name')}<input style={inputStyle} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Acme Corp" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>{lbl('Start Date')}<input style={inputStyle} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                <div>{lbl('End Date')}<input style={inputStyle} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
              </div>
              <div>{lbl('Notes')}<textarea style={{ ...inputStyle, height: 70, resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any extra context..." /></div>
            </div>
          </div>

          {/* Platform + partner + service */}
          <div style={{
            background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: 24, boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 18 }}>Source & Classification</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div>
                {lbl('Platform', selectedPlatform ? `${selectedPlatform.commission_pct}% fee` : undefined)}
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={platformId} onChange={e => setPlatformId(e.target.value)}>
                  <option value="">No platform</option>
                  {platforms.map(p => <option key={p.id} value={p.id} style={{ background: '#1e1e22' }}>{p.name}</option>)}
                </select>
              </div>
              <div>
                {lbl('Partner', selectedPartner ? `${selectedPartner.revenue_share_pct}% cut` : 'Optional')}
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={partnerId} onChange={e => setPartnerId(e.target.value)}>
                  <option value="">No partner</option>
                  {partners.map(p => <option key={p.id} value={p.id} style={{ background: '#1e1e22' }}>{p.name}</option>)}
                </select>
              </div>
              <div>
                {lbl('Service Type')}
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={serviceTypeId} onChange={e => setServiceTypeId(e.target.value)}>
                  <option value="">No type</option>
                  {serviceTypes.map(s => <option key={s.id} value={s.id} style={{ background: '#1e1e22' }}>{s.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Financials */}
          <div style={{
            background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: 24, boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 18 }}>Financials (USD)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div>{lbl('Gross Value *', 'Top-line before deductions')}<input style={inputStyle} type="number" value={grossValue || ''} onChange={e => setGrossValue(Number(e.target.value))} placeholder="1000" /></div>
              <div>{lbl('Delivery Cost', 'Writers, devs, QA')}<input style={inputStyle} type="number" value={deliveryCost || ''} onChange={e => setDeliveryCost(Number(e.target.value))} placeholder="0" /></div>
              <div>{lbl('Transfer Fee', 'Per payout batch')}<input style={inputStyle} type="number" value={transferFee || ''} onChange={e => setTransferFee(Number(e.target.value))} placeholder="25" /></div>
            </div>
          </div>
        </div>

        {/* Right — live P&L */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            background: '#1e1e22', border: '1px solid rgba(20,136,252,0.2)',
            borderRadius: 12, padding: 22, boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
            position: 'sticky' as const, top: 20,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 20 }}>
              Live P&L Preview
            </div>

            {/* Gross */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1a1a1a' }}>
              <span style={{ fontSize: 13, color: '#8a8a8f' }}>Gross Value</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>${grossValue.toLocaleString()}</span>
            </div>

            {/* Deductions */}
            {deductions.map(d => (
              <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #141416' }}>
                <span style={{ fontSize: 12, color: '#5a5a5a' }}>{d.label}</span>
                <span style={{ fontSize: 12, color: d.value > 0 ? d.color : '#3a3a3a' }}>
                  {d.value > 0 ? `−$${d.value.toFixed(0)}` : '—'}
                </span>
              </div>
            ))}

            {/* Net profit */}
            <div style={{
              padding: '16px 14px', marginTop: 10,
              background: net_profit > 0 ? 'rgba(20,136,252,0.08)' : 'rgba(248,113,113,0.08)',
              border: `1px solid ${net_profit > 0 ? 'rgba(20,136,252,0.2)' : 'rgba(248,113,113,0.2)'}`,
              borderRadius: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#8a8a8f' }}>Net Profit</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: net_profit > 0 ? '#1488fc' : '#f87171', letterSpacing: '-0.5px' }}>
                  ${net_profit.toFixed(0)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#4a4a4a' }}>Margin</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: margin_pct < 15 ? '#f87171' : '#4ade80' }}>
                  {margin_pct.toFixed(1)}%
                  {margin_pct < 15 && grossValue > 0 && (
                    <span style={{ fontSize: 11, color: '#f87171', marginLeft: 6 }}>⚠ below threshold</span>
                  )}
                </span>
              </div>
            </div>

            {/* Structural loss */}
            {grossValue > 0 && (
              <div style={{ marginTop: 12, fontSize: 11, color: '#3a3a3a', lineHeight: 1.6 }}>
                Structural loss (fees + charity): ${(platform_fee + partner_cut + charity + transferFee).toFixed(0)} ({((platform_fee + partner_cut + charity + transferFee) / grossValue * 100).toFixed(0)}% of gross)
              </div>
            )}

            <button onClick={save} disabled={saving || !name || !grossValue} style={{
              marginTop: 16, width: '100%', padding: '12px',
              background: '#1488fc', border: 'none', borderRadius: 999,
              boxShadow: '0 0 20px rgba(20,136,252,0.3)',
              cursor: saving || !name || !grossValue ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 500, color: '#fff', fontFamily: 'inherit',
              opacity: !name || !grossValue ? 0.5 : 1,
            }}>{saving ? 'Saving...' : 'Save Project'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}