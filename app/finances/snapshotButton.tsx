'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SnapshotButton({
  currentMonth, hasSnapshot,
  totalRevenue, totalCostsUsd, fixedCostsPkr,
  businessNetProfit, charityPaid, partnerPayouts, finalRetainedProfit
}: any) {
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(hasSnapshot)

  const takeSnapshot = async () => {
    if (done) return
    if (!confirm(`Save snapshot for ${currentMonth}? This cannot be edited later.`)) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('monthly_snapshots').insert({
      month: currentMonth,
      total_revenue: totalRevenue,
      total_costs_usd: totalCostsUsd,
      total_fixed_costs_pkr: fixedCostsPkr,
      business_net_profit: businessNetProfit,
      charity_paid: charityPaid,
      partner_payouts: partnerPayouts,
      final_retained_profit: finalRetainedProfit,
      created_by: user?.id,
    })
    setSaving(false)
    setDone(true)
  }

  if (done) {
    return (
      <span style={{ fontSize: 11, color: '#4ade80', padding: '3px 10px', borderRadius: 999, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
        ✓ Saved
      </span>
    )
  }

  return (
    <button onClick={takeSnapshot} disabled={saving} style={{
      padding: '5px 14px', background: 'rgba(20,136,252,0.1)',
      border: '1px solid rgba(20,136,252,0.2)', borderRadius: 999,
      cursor: 'pointer', fontSize: 12, color: '#1488fc', fontFamily: 'inherit',
    }}>
      {saving ? 'Saving...' : `Snapshot ${currentMonth}`}
    </button>
  )
}