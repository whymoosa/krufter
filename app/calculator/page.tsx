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

const lbl = (t: string, sub?: string) => (
  <div style={{ marginBottom: 7 }}>
    <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>{t}</div>
    {sub && <div style={{ fontSize: 11, color: '#3a3a3a', marginTop: 2 }}>{sub}</div>}
  </div>
)

type Currency = 'USD' | 'PKR'

export default function Calculator() {
  const [currency, setCurrency] = useState<Currency>('USD')
  const [exchangeRate, setExchangeRate] = useState(280)

  const [grossValue, setGrossValue] = useState(1000)
  const [upworkFee, setUpworkFee] = useState(15)
  const [partnerCut, setPartnerCut] = useState(14)
  const [transferFee, setTransferFee] = useState(25)
  const [deliveryCost, setDeliveryCost] = useState(200)

  const [rent, setRent] = useState(48500)
  const [electricity, setElectricity] = useState(10000)
  const [cleaning, setCleaning] = useState(17000)
  const [food, setFood] = useState(15000)
  const [projectsPerMonth, setProjectsPerMonth] = useState(5)

  const [monthlyTargetUSD, setMonthlyTargetUSD] = useState(1000)

  // ── CALCULATIONS ──────────────────────────────────────────
  // Business P&L (View A) — no partner, no charity
  const platform_fee = grossValue * (upworkFee / 100)
  const after_platform = grossValue - platform_fee
  const partner_deduction = after_platform * (partnerCut / 100)
  const after_partner = after_platform - partner_deduction
  const after_transfer = after_partner - transferFee
  const business_net = after_transfer - deliveryCost

  // Fixed cost allocation
  const totalFixedPKR = rent + electricity + cleaning + food
  const totalFixedUSD = totalFixedPKR / exchangeRate
  const fixedCostPerProject = totalFixedUSD / projectsPerMonth
  const after_fixed = business_net - fixedCostPerProject

  // Distribution (View B) — charity only on profit
  const charity = after_fixed > 0 ? after_fixed * 0.15 : 0
  const trueProfit = after_fixed - charity

  const marginPct = grossValue > 0 ? ((trueProfit / grossValue) * 100).toFixed(1) : '0.0'
  const structuralLoss = platform_fee + partner_deduction + transferFee
  const structuralPct = grossValue > 0 ? ((structuralLoss / grossValue) * 100).toFixed(0) : '0'

  const projectsNeeded = trueProfit > 0 ? Math.ceil(monthlyTargetUSD / trueProfit) : null

  const fmt = (usd: number) => {
    if (currency === 'USD') return `$${usd.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    return `₨${(usd * exchangeRate).toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const fmtPKR = (pkr: number) => {
    if (currency === 'PKR') return `₨${pkr.toLocaleString()}`
    return `$${(pkr / exchangeRate).toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  // Waterfall steps — charity appears AFTER fixed costs, only on profit
  const steps = [
    {
      label: 'Gross Project Value',
      value: grossValue,
      deduction: null,
      deductionColor: '#fff',
      note: 'Starting point',
      section: 'A',
    },
    {
      label: `Upwork Fee (${upworkFee}%)`,
      value: after_platform,
      deduction: platform_fee,
      deductionColor: '#f87171',
      note: 'Platform commission',
      section: 'A',
    },
    {
      label: `US Partner Cut (${partnerCut}%)`,
      value: after_partner,
      deduction: partner_deduction,
      deductionColor: '#f87171',
      note: 'US access + payment enablement',
      section: 'A',
    },
    {
      label: 'Transfer Fee',
      value: after_transfer,
      deduction: transferFee,
      deductionColor: '#f87171',
      note: 'Batched payout cost',
      section: 'A',
    },
    {
      label: 'Delivery Costs',
      value: business_net,
      deduction: deliveryCost,
      deductionColor: '#f87171',
      note: 'Writers, devs, QA, revisions',
      section: 'A',
    },
    {
      label: 'Fixed Costs (per project share)',
      value: after_fixed,
      deduction: fixedCostPerProject,
      deductionColor: '#fbbf24',
      note: `Office, electricity, cleaning, food ÷ ${projectsPerMonth} projects`,
      section: 'A',
    },
    {
      label: 'Charity (15% of profit)',
      value: trueProfit,
      deduction: charity,
      deductionColor: after_fixed > 0 ? '#818cf8' : '#3a3a3a',
      note: after_fixed > 0 ? '15% of net profit — applied only if profitable' : 'No charity — project not profitable',
      section: 'B',
    },
  ]

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
            display: 'flex', background: '#1e1e22',
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
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* LEFT — Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Project Value</div>
            {lbl('Gross Project Value (USD)', 'Top-line before any deductions')}
            <input style={inputStyle} type="number" value={grossValue}
              onChange={e => setGrossValue(Number(e.target.value))} min={0} />
          </div>

          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
              Structural Deductions
            </div>
            <div style={{ fontSize: 11, color: '#4a4a4a', marginBottom: 16 }}>
              Non-negotiable costs before profit exists
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                {lbl('Upwork Fee (%)')}
                <input style={inputStyle} type="number" value={upworkFee}
                  onChange={e => setUpworkFee(Number(e.target.value))} min={0} max={100} />
              </div>
              <div>
                {lbl('US Partner Cut (%)', 'US access, IDs, payment enablement')}
                <input style={inputStyle} type="number" value={partnerCut}
                  onChange={e => setPartnerCut(Number(e.target.value))} min={0} max={100} />
              </div>
              <div>
                {lbl('Transfer Fee (USD)', 'Per payout, batched')}
                <input style={inputStyle} type="number" value={transferFee}
                  onChange={e => setTransferFee(Number(e.target.value))} min={0} />
              </div>
            </div>
          </div>

          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
              Delivery Costs (USD)
            </div>
            <div style={{ fontSize: 11, color: '#4a4a4a', marginBottom: 14 }}>Per project</div>
            {lbl('Writers, devs, QA, revisions, PM time')}
            <input style={inputStyle} type="number" value={deliveryCost}
              onChange={e => setDeliveryCost(Number(e.target.value))} min={0} />
          </div>

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
                  {lbl(item.l)}
                  <input style={inputStyle} type="number" value={item.v}
                    onChange={e => item.set(Number(e.target.value))} min={0} />
                </div>
              ))}
              <div>
                {lbl('Projects This Month', 'Splits fixed costs per project')}
                <input style={inputStyle} type="number" value={projectsPerMonth}
                  onChange={e => setProjectsPerMonth(Number(e.target.value))} min={1} />
              </div>
            </div>
          </div>

          {/* Charity notice */}
          <div style={{
            ...card,
            background: 'rgba(129,140,248,0.04)',
            border: '1px solid rgba(129,140,248,0.15)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#818cf8', marginBottom: 8 }}>
              Charity — 15% of Net Profit
            </div>
            <div style={{ fontSize: 12, color: '#5a5a5a', lineHeight: 1.6 }}>
              Charity is calculated as <strong style={{ color: '#818cf8' }}>15% of net profit</strong> after
              all costs including fixed costs. If the project is not profitable, charity = ₨0.
              This is a fixed principle — not editable.
            </div>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#4a4a4a' }}>Profit before charity</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{fmt(after_fixed)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 6 }}>
              <span style={{ color: '#4a4a4a' }}>Charity amount</span>
              <span style={{ color: after_fixed > 0 ? '#818cf8' : '#3a3a3a', fontWeight: 600 }}>
                {fmt(charity)}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT — Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Waterfall */}
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 20 }}>
              Profit Waterfall
            </div>

            {/* View A label */}
            <div style={{ fontSize: 10, color: '#3a3a3a', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>
              View A — Business P&L
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {steps.map((step, i) => {
                const isFirst = i === 0
                const isLast = i === steps.length - 1
                const isCharityStep = step.section === 'B' && i > 0
                const pct = Math.max(0, (step.value / grossValue) * 100)

                return (
                  <div key={step.label}>
                    {/* View B divider before charity */}
                    {isCharityStep && (
                      <div style={{
                        fontSize: 10, color: '#3a3a3a',
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.08em',
                        margin: '10px 0 8px',
                      }}>
                        View B — Distribution
                      </div>
                    )}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px', borderRadius: 8,
                      background: isLast
                        ? 'rgba(20,136,252,0.08)'
                        : isCharityStep
                          ? 'rgba(129,140,248,0.04)'
                          : 'rgba(255,255,255,0.02)',
                      border: isLast
                        ? '1px solid rgba(20,136,252,0.2)'
                        : isCharityStep
                          ? '1px solid rgba(129,140,248,0.1)'
                          : '1px solid transparent',
                    }}>
                      <div>
                        <div style={{
                          fontSize: 13,
                          color: isLast ? '#fff' : isCharityStep ? '#818cf8' : '#8a8a8f',
                          fontWeight: isFirst || isLast ? 600 : 400,
                        }}>
                          {step.label}
                        </div>
                        <div style={{ fontSize: 11, color: '#3a3a3a', marginTop: 2 }}>{step.note}</div>
                      </div>
                      <div style={{ textAlign: 'right' as const }}>
                        <div style={{
                          fontSize: 14, fontWeight: 700,
                          color: isLast ? '#1488fc' : isCharityStep ? '#818cf8' : '#fff',
                        }}>
                          {fmt(step.value)}
                        </div>
                        {step.deduction !== null && step.deduction > 0 && (
                          <div style={{ fontSize: 11, color: step.deductionColor, marginTop: 1 }}>
                            −{fmt(step.deduction)}
                          </div>
                        )}
                        {step.deduction !== null && step.deduction === 0 && isCharityStep && (
                          <div style={{ fontSize: 11, color: '#3a3a3a', marginTop: 1 }}>no charity</div>
                        )}
                      </div>
                    </div>

                    <div style={{ height: 3, background: '#1a1a1a', borderRadius: 2, margin: '3px 0' }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        width: `${Math.min(100, pct)}%`,
                        background: isLast ? '#1488fc' : isCharityStep ? '#818cf8' : '#2a2a2a',
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
              gap: 10, marginTop: 20, padding: 16,
              background: '#141416', borderRadius: 10,
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
                  padding: '8px 0', borderBottom: '1px solid #1a1a1a', fontSize: 13,
                }}>
                  <span style={{ color: '#8a8a8f' }}>{item.label}</span>
                  <span style={{ color: '#fff' }}>{fmtPKR(item.pkr)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 13 }}>
                <span style={{ color: '#5a5a5a' }}>Total / month</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{fmtPKR(totalFixedPKR)}</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 12px', fontSize: 13,
                background: 'rgba(255,255,255,0.02)', borderRadius: 8,
              }}>
                <span style={{ color: '#5a5a5a' }}>Per project ({projectsPerMonth} projects)</span>
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>{fmt(fixedCostPerProject)}</span>
              </div>
            </div>
          </div>

          {/* Monthly target */}
          <div style={{
            ...card,
            border: '1px solid rgba(20,136,252,0.2)',
            background: 'rgba(20,136,252,0.04)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 16 }}>
              Monthly Target Calculator
            </div>
            <div style={{ marginBottom: 16 }}>
              {lbl('I want to profit this much per month (USD)')}
              <input style={inputStyle} type="number" value={monthlyTargetUSD}
                onChange={e => setMonthlyTargetUSD(Number(e.target.value))} min={0} />
              <div style={{ fontSize: 11, color: '#4a4a4a', marginTop: 6 }}>
                = {fmtPKR(monthlyTargetUSD * exchangeRate)} PKR / month
              </div>
            </div>

            {trueProfit <= 0 ? (
              <div style={{
                padding: 14, borderRadius: 10,
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.2)',
                fontSize: 13, color: '#f87171',
              }}>
                ⚠️ This project structure is losing money. Reduce delivery costs or increase project value.
              </div>
            ) : (
              <div style={{
                padding: 16, borderRadius: 10,
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
                    padding: '8px 12px', borderRadius: 8, fontSize: 13,
                    background: row.projects === projectsNeeded ? 'rgba(20,136,252,0.1)' : 'rgba(255,255,255,0.02)',
                  }}>
                    <span style={{ color: '#5a5a5a' }}>{row.projects} projects/month</span>
                    <span style={{ color: row.projects === projectsNeeded ? '#1488fc' : '#8a8a8f', fontWeight: 600 }}>
                      {fmt(row.projects * trueProfit)} · {row.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom insight */}
      <div style={{ ...card, background: '#141416', marginTop: 2 }}>
        <div style={{ fontSize: 12, color: '#3a3a3a', lineHeight: 1.7 }}>
          <span style={{ color: '#5a5a5a', fontWeight: 500 }}>Key insight: </span>
          On a {fmt(grossValue)} project, {structuralPct}% ({fmt(structuralLoss)}) is lost to platform fees, partner cuts, and transfer costs before work starts.
          Charity ({fmt(charity)}) is taken from profit — not revenue — so unprofitable projects have zero charity obligation.
          At {projectsPerMonth} projects/month, fixed cost burden is {fmt(fixedCostPerProject)}/project.
          Double to {projectsPerMonth * 2} projects and that drops to {fmt(fixedCostPerProject / 2)}/project.
        </div>
      </div>
    </div>
  )
}