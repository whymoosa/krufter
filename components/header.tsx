'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePathname } from 'next/navigation'

const pageNames: Record<string, string> = {
    '/': 'Dashboard',
    '/finances': 'Finances',
    '/finances/projects': 'Financial Projects',
    '/finances/expenses': 'Expenses',
    '/finances/platforms': 'Platforms',
    '/finances/partners': 'Partners',
    '/invoices': 'Invoices',
    '/projects': 'Projects',
    '/calculator': 'Calculator',
    '/admin/team': 'Team',
    '/my-tasks': 'My Tasks',
    '/activity': 'Activity',
  }

const roleColors: Record<string, string> = {
  admin: '#1488fc',
  project_manager: '#818cf8',
  writer: '#4ade80',
  sales: '#fbbf24',
  developer: '#f87171',
  freelancer: '#a78bfa',
  member: '#5a5a5a',
}

export default function Header() {
  const pathname = usePathname()
  const [profile, setProfile] = useState<any>(null)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    if (pathname !== '/login') fetchProfile()
  }, [pathname])

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()
    setProfile(data)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Hide header on login page
  if (pathname === '/login') return null

  const pageName = Object.entries(pageNames).find(([path]) =>
    path === pathname || (path !== '/' && pathname.startsWith(path))
  )?.[1] ?? 'Krufter'

  return (
    <header style={{
      height: 56, background: '#0a0a0a',
      borderBottom: '1px solid #1a1a1a',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px', flexShrink: 0,
      position: 'relative', zIndex: 10,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{pageName}</div>

      {profile && (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 12px 6px 6px',
              background: showMenu ? '#1e1e22' : 'transparent',
              border: `1px solid ${showMenu ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
              borderRadius: 999, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: '#1488fc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {(profile.full_name || profile.email || '?')[0].toUpperCase()}
            </div>
            <div style={{ textAlign: 'left' as const }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#e8e8e8', lineHeight: 1.2 }}>
                {profile.full_name || profile.email?.split('@')[0]}
              </div>
              <div style={{ fontSize: 10, color: roleColors[profile.role] ?? '#5a5a5a', textTransform: 'capitalize', lineHeight: 1.2 }}>
                {profile.role}
              </div>
            </div>
            <span style={{
              fontSize: 10, color: '#4a4a4a', marginLeft: 2,
              transform: showMenu ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s', display: 'inline-block',
            }}>▾</span>
          </button>

          {showMenu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowMenu(false)} />
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                zIndex: 50, minWidth: 210,
                background: '#1e1e22',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                overflow: 'hidden',
              }}>
                {/* User info */}
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #1a1a1a' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 3 }}>
                    {profile.full_name || 'User'}
                  </div>
                  <div style={{ fontSize: 12, color: '#5a5a5a', marginBottom: 6 }}>{profile.email}</div>
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 999,
                    background: `${roleColors[profile.role] ?? '#5a5a5a'}15`,
                    color: roleColors[profile.role] ?? '#5a5a5a',
                    border: `1px solid ${roleColors[profile.role] ?? '#5a5a5a'}30`,
                    textTransform: 'capitalize',
                  }}>{profile.role}</span>
                </div>

                {/* Menu items */}
                <div style={{ padding: '6px' }}>
                  {(profile.role === 'admin') && (
                    <a href="/admin/team"
                      onClick={() => setShowMenu(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', borderRadius: 8,
                        fontSize: 13, color: '#9ca3af', textDecoration: 'none',
                      }}>
                      <span>👥</span> Manage Team
                    </a>
                  )}
                  {(profile.role === 'admin' || profile.role === 'project_manager') && (
                    <a href="/projects"
                      onClick={() => setShowMenu(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', borderRadius: 8,
                        fontSize: 13, color: '#9ca3af', textDecoration: 'none',
                      }}>
                      <span>📁</span> Projects
                    </a>
                  )}
                  {(profile.role !== 'admin' && profile.role !== 'project_manager') && (
                    <a href="/my-tasks"
                      onClick={() => setShowMenu(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', borderRadius: 8,
                        fontSize: 13, color: '#9ca3af', textDecoration: 'none',
                      }}>
                      <span>✓</span> My Tasks
                    </a>
                  )}
                  <div style={{ height: 1, background: '#1a1a1a', margin: '4px 0' }} />
                  <button
                    onClick={handleSignOut}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', borderRadius: 8,
                      fontSize: 13, color: '#f87171',
                      background: 'transparent', border: 'none',
                      cursor: 'pointer', fontFamily: 'inherit',
                      textAlign: 'left' as const,
                    }}
                  >
                    <span>⎋</span> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  )
}