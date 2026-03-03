import { supabase } from '@/lib/supabase'

const actionColors: Record<string, string> = {
  logged_income: '#4ade80',
  deleted_income: '#f87171',
  logged_expense: '#fbbf24',
  deleted_expense: '#f87171',
  updated_invoice: '#1488fc',
  deleted_invoice: '#f87171',
  created_task: '#818cf8',
  updated_task: '#1488fc',
}

const actionIcons: Record<string, string> = {
  logged_income: '💰',
  deleted_income: '🗑️',
  logged_expense: '💸',
  deleted_expense: '🗑️',
  updated_invoice: '🧾',
  deleted_invoice: '🗑️',
  created_task: '✅',
  updated_task: '✏️',
}

export default async function ActivityPage() {
  const { data: logs } = await supabase
    .from('activity_log')
    .select('*, profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>Activity</h1>
        <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 8 }}>Everything that's happened in Krufter.</p>
      </div>

      <div style={{
        background: '#1e1e22', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
      }}>
        {!logs?.length ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <p style={{ fontSize: 14, color: '#5a5a5a' }}>No activity yet</p>
          </div>
        ) : logs.map((log: any, i: number) => {
          const color = actionColors[log.action] ?? '#5a5a5a'
          const icon = actionIcons[log.action] ?? '•'
          const name = log.profiles?.full_name || log.profiles?.email || 'Unknown'
          const time = new Date(log.created_at)
          const timeStr = time.toLocaleDateString() + ' · ' + time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

          return (
            <div key={log.id} style={{
              display: 'flex', gap: 14, alignItems: 'flex-start',
              padding: '14px 20px',
              borderBottom: i < logs.length - 1 ? '1px solid #1a1a1a' : 'none',
            }}>
              {/* Icon */}
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: `${color}12`,
                border: `1px solid ${color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, flexShrink: 0, marginTop: 1,
              }}>{icon}</div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#e8e8e8', lineHeight: 1.4, marginBottom: 4 }}>
                  <span style={{ fontWeight: 500, color: '#fff' }}>{name}</span>
                  {' '}
                  <span style={{ color: '#8a8a8f' }}>{log.details}</span>
                </div>
                <div style={{ fontSize: 11, color: '#3a3a3a' }}>{timeStr}</div>
              </div>

              {/* Action tag */}
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 999, flexShrink: 0,
                background: `${color}12`, color, border: `1px solid ${color}25`,
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
              }}>{log.action.replace(/_/g, ' ')}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}