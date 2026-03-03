import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const statusColors: Record<string, string> = {
  active: '#1488fc', completed: '#4ade80', paused: '#fbbf24', cancelled: '#f87171'
}

const card = {
  background: '#1e1e22',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
  padding: '22px 24px',
  boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
}

export default async function ProjectsPage() {
  const { data: projects } = await supabase
    .from('projects')
    .select('*, tasks(id, status)')
    .order('created_at', { ascending: false })

  return (
    <div style={{ maxWidth: 880 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>Projects</h1>
          <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 8 }}>{projects?.length ?? 0} total</p>
        </div>
        <Link href="/projects/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', background: '#1488fc', borderRadius: 999,
          boxShadow: '0 0 20px rgba(20,136,252,0.3)',
          fontSize: 13, fontWeight: 500, color: '#fff',
        }}>+ New Project</Link>
      </div>

      {!projects?.length ? (
        <div style={{ ...card, textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>📁</div>
          <p style={{ fontSize: 16, color: '#5a5a5a', marginBottom: 8 }}>No projects yet</p>
          <Link href="/projects/new" style={{ fontSize: 13, color: '#1488fc' }}>Create your first project →</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {projects.map((p: any) => {
            const tasks = p.tasks ?? []
            const done = tasks.filter((t: any) => t.status === 'done').length
            const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0
            return (
              <Link key={p.id} href={`/projects/${p.id}`} style={{
                ...card, display: 'block', textDecoration: 'none',
                transition: 'border-color 0.15s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: '#5a5a5a' }}>{p.client_name || 'No client'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {p.deadline && (
                      <div style={{ fontSize: 12, color: '#4a4a4a' }}>
                        Due {new Date(p.deadline).toLocaleDateString()}
                      </div>
                    )}
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 999,
                      background: `${statusColors[p.status] ?? '#5a5a5a'}15`,
                      color: statusColors[p.status] ?? '#5a5a5a',
                      border: `1px solid ${statusColors[p.status] ?? '#5a5a5a'}30`,
                      textTransform: 'capitalize',
                    }}>{p.status}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 4, background: '#1a1a1a', borderRadius: 4 }}>
                    <div style={{
                      height: '100%', borderRadius: 4, width: `${pct}%`,
                      background: '#1488fc', transition: 'width 0.3s',
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: '#4a4a4a', whiteSpace: 'nowrap' }}>
                    {done}/{tasks.length} tasks · {pct}%
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}