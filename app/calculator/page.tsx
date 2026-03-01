'use client'
import { useState } from 'react'

const card = {
  background: '#1e1e22',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
  padding: '24px 26px',
  boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
}

const inputStyle = {
  background: '#141416',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#e8e8e8',
  fontSize: 14,
  width: '100%',
  outline: 'none',
  fontFamily: 'inherit',
}

const label = (t: string, sub?: string) => (
  <div style={{ marginBottom: 7 }}>
    <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>{t}</div>
    {sub && <div style={{ fontSize: 11, color: '#3a3a3a', marginTop: 2 }}>{sub}</div>}
  </div>
)

type Currency = 'USD' | 'PKR'

export default function Calculator() {
  // Settings
  const [currency, setCurrency] = useState<Currency>('USD')
  const [exchangeRate, setExchangeRate] = useState(280)

  // Project inputs
  const [grossValue, setGrossValue] = useState(1000)
  const [upworkFee, setUpworkFee] = useState(15)
  const [partnerCut, setPartnerCut] = useState(14)
  const [charity, setCharity] = useState(15)
  const [transferFee, setTransferFee] = useState(25)
  const [deliveryCost, setDeliveryCost] = useState(200)

  // Monthly fixed costs (PKR)
  const [rent, setRent] = useState(48500)
  const [electricity, setElectricity] = useState(10000)
  const [cleaning, setCleaning] = useState(17000)
  const [food, setFood] = useState(15000)
  const [projectsPerMonth, setProjectsPerMonth] = useState(5)

  // Monthly target
  const [monthlyTargetUSD, setMonthlyTargetUSD] = useState(1000)

  // ── CALCULATIONS ──────────────────────────────────────────

  // Step by step deductions (all in USD)
  const afterUpwork = grossValue - (grossValue * upworkFee / 100)
  const afterPartner = afterUpwork - (afterUpwork * partnerCut / 100)
  const afterCharity = afterPartner - (afterPartner * charity / 100)
  const afterTransfer = afterCharity - transferFee
  const afterDelivery = afterTransfer - deliveryCost

  // Monthly fixed costs in USD
  const totalFixedPKR = rent + electricity + cleaning + food
  const totalFixedUSD = totalFixedPKR / exchangeRate
  const fixedCostPerProject = totalFixedUSD / projectsPerMonth

  // True profit per project
  const trueProfit = afterDelivery - fixedCostPerProject

  // How many projects needed for monthly target
  const projectsNeeded = trueProfit > 0
    ? Math.ceil(monthlyTargetUSD / trueProfit)
    : null

  // Display helpers
  const fmt = (usd: number) => {
    if (currency === 'USD') return `$${usd.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    const pkr = usd * exchangeRate
    return `₨${pkr.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const fmtPKR = (pkr: number) => {
    if (currency === 'PKR') return `₨${pkr.toLocaleString()}`
    return `$${(pkr / exchangeRate).toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const steps = [
    {
      label: 'Gross Project Value',
      value: grossValue,
      deduction: null,
      color: '#fff',
      note: 'Starting point',
    },
    {
      label: `Upwork Fee (${upworkFee}%)`,
      value: afterUpwork,
      deduction: grossValue - afterUpwork,
      color: '#f87171',
      note: 'Platform commission',
    },
    {
      label: `US Partner Cut (${partnerCut}%)`,
      value: afterPartner,
      deduction: afterUpwork - afterPartner,
      color: '#f87171',
      note: 'US access + payment enablement',
    },
    {
      label: `Charity (${charity}%)`,
      value: afterCharity,
      deduction: afterPartner - afterCharity,
      color: '#f87171',
      note: 'Fixed principle',
    },
    {
      label: 'Transfer Fee',
      value: afterTransfer,
      deduction: transferFee,
      color: '#f87171',
      note: 'Batched payout cost',
    },
    {
      label: 'Delivery Costs',
      value: afterDelivery,
      deduction: deliveryCost,
      color: '#f87171',
      note: 'Writers, devs, QA, revisions',
    },
    {
      label: 'Fixed Costs (per project share)',
      value: afterDelivery - fixedCostPerProject,
      deduction: fixedCostPerProject,
      color: '#fbbf24',
      note: `Office, electricity, cleaning, food ÷ ${projectsPerMonth} projects`,
    },
  ]

  const marginPct = ((trueProfit / grossValue) * 100).toFixed(1)
  const structuralLoss = grossValue - afterTransfer
  const structuralPct = ((structuralLoss / grossValue) * 100).toFixed(0)

  return (
    <div style={{ maxWidth: 920 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>
            Project Calculator
          </h1>
          <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 8 }}>
            See exactly what you pocket after every deduction.
          </p>
        </div>

        {/* Currency toggle + exchange rate */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#4a4a4a' }}>1 USD =</span>
            <input
              style={{ ...inputStyle, width: 90, padding: '7px 10px', fontSize: 13 }}
              type="number"
              value={exchangeRate}
              onChange={e => setExchangeRate(Number(e.target.value))}
            />
            <span style={{ fontSize: 12, color: '#4a4a4a' }}>PKR</span>
          </div>
          <div style={{
            display: 'flex',
            background: '#1e1e22',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 999, padding: 3,
          }}>
            {(['USD', 'PKR'] as Currency[]).map(c => (
              <button key={c} onClick={() => setCurrency(c)} style={{
                padding: '6px 16px', borderRadius: 999,
                background: currency === c ? '#1488fc' : 'transparent',
                border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 500,
                color: currency === c ? '#fff' : '#5a5a5a',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* LEFT — Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Project value */}
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 16 }}>
              Project Value
            </div>
            <div>
              {label('Gross Project Value (USD)', 'Top-line before any deductions')}
              <input style={inputStyle} type="number" value={grossValue}
                onChange={e => setGrossValue(Number(e.target.value))} min={0} />
            </div>
          </div>

          {/* Structural deductions */}
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 16 }}>
              Structural Deductions
              <span style={{ fontSize: 11, color: '#5a5a5a', fontWeight: 400, marginLeft: 8 }}>
                non-negotiable
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                {label('Upwork Fee (%)')}
                <input style={inputStyle} type="number" value={upworkFee}
                  onChange={e => setUpworkFee(Number(e.target.value))} min={0} max={100} />
              </div>
              <div>
                {label('US Partner Cut (%)', 'US access, IDs, payment enablement')}
                <input style={inputStyle} type="number" value={partnerCut}
                  onChange={e => setPartnerCut(Number(e.target.value))} min={0} max={100} />
              </div>
              <div>
                {label('Charity (%)', 'Fixed principle, not negotiable')}
                <input style={inputStyle} type="number" value={charity}
                  onChange={e => setCharity(Number(e.target.value))} min={0} max={100} />
              </div>
              <div>
                {label('Transfer Fee (USD)', 'Per payout, batched')}
                <input style={inputStyle} type="number" value={transferFee}
                  onChange={e => setTransferFee(Number(e.target.value))} min={0} />
              </div>
            </div>
          </div>

          {/* Delivery costs */}
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 16 }}>
              Delivery Costs (USD)
              <span style={{ fontSize: 11, color: '#5a5a5a', fontWeight: 400, marginLeft: 8 }}>
                per project
              </span>
            </div>
            {label('Writers, devs, QA, revisions, PM time')}
            <input style={inputStyle} type="number" value={deliveryCost}
              onChange={e => setDeliveryCost(Number(e.target.value))} min={0} />
          </div>

          {/* Monthly fixed costs */}
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 16 }}>
              Monthly Fixed Costs (PKR)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { l: 'Office Rent + Maintenance', v: rent, set: setRent },
                { l: 'Electricity', v: electricity, set: setElectricity },
                { l: 'Cleaning Services', v: cleaning, set: setCleaning },
                { l: 'Food', v: food, set: setFood },
              ].map(item => (
                <div key={item.l}>
                  {label(item.l)}
                  <input style={inputStyle} type="number" value={item.v}
                    onChange={e => item.set(Number(e.target.value))} min={0} />
                </div>
              ))}
              <div>
                {label('Projects This Month', 'Used to split fixed costs per project')}
                <input style={inputStyle} type="number" value={projectsPerMonth}
                  onChange={e => setProjectsPerMonth(Number(e.target.value))} min={1} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Waterfall breakdown */}
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 20 }}>
              Profit Waterfall
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {steps.map((step, i) => {
                const isFirst = i === 0
                const isLast = i === steps.length - 1
                const pct = ((step.value / grossValue) * 100).toFixed(0)
                return (
                  <div key={step.label}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px',
                      background: isLast ? 'rgba(20,136,252,0.08)' : 'rgba(255,255,255,0.02)',
                      borderRadius: 8,
                      border: isLast ? '1px solid rgba(20,136,252,0.2)' : '1px solid transparent',
                    }}>
                      <div>
                        <div style={{ fontSize: 13, color: isLast ? '#fff' : '#8a8a8f', fontWeight: isFirst || isLast ? 600 : 400 }}>
                          {step.label}
                        </div>
                        <div style={{ fontSize: 11, color: '#3a3a3a', marginTop: 2 }}>{step.note}</div>
                      </div>
                      <div style={{ textAlign: 'right' as const }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: isLast ? '#1488fc' : '#fff' }}>
                          {fmt(step.value)}
                        </div>
                        {step.deduction !== null && (
                          <div style={{ fontSize: 11, color: step.color, marginTop: 1 }}>
                            −{fmt(step.deduction)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 3, background: '#1a1a1a', borderRadius: 2, margin: '3px 0' }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        width: `${Math.max(0, Number(pct))}%`,
                        background: isLast ? '#1488fc' : '#2a2a2a',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Summary stats */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              gap: 10, marginTop: 20,
              padding: '16px',
              background: '#141416',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ textAlign: 'center' as const }}>
                <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6 }}>
                  True Profit
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: trueProfit > 0 ? '#fff' : '#f87171' }}>
                  {fmt(trueProfit)}
                </div>
              </div>
              <div style={{ textAlign: 'center' as const, borderLeft: '1px solid #1a1a1a', borderRight: '1px solid #1a1a1a' }}>
                <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6 }}>
                  Margin
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: Number(marginPct) > 20 ? '#fff' : '#fbbf24' }}>
                  {marginPct}%
                </div>
              </div>
              <div style={{ textAlign: 'center' as const }}>
                <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6 }}>
                  Structural Loss
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#f87171' }}>
                  {structuralPct}%
                </div>
              </div>
            </div>
          </div>

          {/* Fixed costs breakdown */}
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 16 }}>
              Monthly Fixed Costs
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Office Rent', pkr: rent },
                { label: 'Electricity', pkr: electricity },
                { label: 'Cleaning', pkr: cleaning },
                { label: 'Food', pkr: food },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: '1px solid #1a1a1a',
                  fontSize: 13,
                }}>
                  <span style={{ color: '#8a8a8f' }}>{item.label}</span>
                  <span style={{ color: '#fff' }}>{fmtPKR(item.pkr)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 13 }}>
                <span style={{ color: '#5a5a5a' }}>Total / month</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{fmtPKR(totalFixedPKR)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', fontSize: 13, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                <span style={{ color: '#5a5a5a' }}>Per project ({projectsPerMonth} projects)</span>
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>{fmt(fixedCostPerProject)}</span>
              </div>
            </div>
          </div>

          {/* Monthly target calculator */}
          <div style={{
            ...card,
            border: '1px solid rgba(20,136,252,0.2)',
            background: 'rgba(20,136,252,0.04)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 16 }}>
              Monthly Target Calculator
            </div>

            <div style={{ marginBottom: 16 }}>
              {label('I want to profit this much per month (USD)')}
              <input style={inputStyle} type="number" value={monthlyTargetUSD}
                onChange={e => setMonthlyTargetUSD(Number(e.target.value))} min={0} />
              <div style={{ fontSize: 11, color: '#4a4a4a', marginTop: 6 }}>
                = {fmtPKR(monthlyTargetUSD * exchangeRate)} PKR / month
              </div>
            </div>

            {trueProfit <= 0 ? (
              <div style={{
                padding: '14px', borderRadius: 10,
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.2)',
                fontSize: 13, color: '#f87171',
              }}>
                ⚠️ This project structure is currently losing money. Reduce delivery costs or increase project value.
              </div>
            ) : (
              <div style={{
                padding: '16px', borderRadius: 10,
                background: 'rgba(20,136,252,0.08)',
                border: '1px solid rgba(20,136,252,0.2)',
                textAlign: 'center' as const,
              }}>
                <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 8 }}>
                  Projects needed this month
                </div>
                <div style={{ fontSize: 52, fontWeight: 800, color: '#1488fc', letterSpacing: '-2px', lineHeight: 1 }}>
                  {projectsNeeded}
                </div>
                <div style={{ fontSize: 12, color: '#5a5a5a', marginTop: 8 }}>
                  × {fmt(grossValue)} projects = {fmt((projectsNeeded ?? 0) * grossValue)} gross revenue
                </div>
                <div style={{ fontSize: 12, color: '#5a5a5a', marginTop: 4 }}>
                  {fmt(trueProfit)} true profit per project
                </div>
              </div>
            )}

            {/* Scaling insight */}
            {trueProfit > 0 && projectsNeeded && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { projects: Math.ceil(projectsNeeded * 0.5), label: '50% of target' },
                  { projects: projectsNeeded, label: 'Hit target' },
                  { projects: Math.ceil(projectsNeeded * 1.5), label: '1.5× target' },
                  { projects: Math.ceil(projectsNeeded * 2), label: '2× target' },
                ].map(row => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', borderRadius: 8,
                    background: row.projects === projectsNeeded ? 'rgba(20,136,252,0.1)' : 'rgba(255,255,255,0.02)',
                    fontSize: 13,
                  }}>
                    <span style={{ color: '#5a5a5a' }}>{row.projects} projects/month</span>
                    <span style={{ color: row.projects === projectsNeeded ? '#1488fc' : '#8a8a8f', fontWeight: 600 }}>
                      {fmt(row.projects * trueProfit)} profit · {row.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom insight */}
      <div style={{
        ...card,
        background: '#141416',
        marginTop: 2,
      }}>
        <div style={{ fontSize: 12, color: '#3a3a3a', lineHeight: 1.7 }}>
          <span style={{ color: '#5a5a5a', fontWeight: 500 }}>Key insight: </span>
          On a {fmt(grossValue)} project, {structuralPct}% ({fmt(structuralLoss)}) is lost to platform fees, partner cuts, charity, and transfer costs before work even starts.
          This is structural — not inefficiency. Margins expand when volume increases and fixed costs stay flat.
          At {projectsPerMonth} projects/month, your fixed cost burden is {fmt(fixedCostPerProject)}/project.
          Double the volume to {projectsPerMonth * 2} projects and that drops to {fmt(fixedCostPerProject / 2)}/project.
        </div>
      </div>

    </div>
  )
}