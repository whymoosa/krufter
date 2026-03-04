'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const adminNav = [
  { href: '/', label: 'Dashboard', icon: '⊞' },
  {
    href: '/finances', label: 'Finances', icon: '◈',
    children: [
      { href: '/finances/projects', label: 'Projects P&L' },
      { href: '/finances/expenses', label: 'Expenses' },
      { href: '/finances/platforms', label: 'Platforms' },
      { href: '/finances/partners', label: 'Partners' },
    ]
  },
  { href: '/invoices', label: 'Invoices', icon: '⊠' },
  {
    href: '/projects', label: 'Work', icon: '◫',
    children: [
      { href: '/projects/clients', label: 'Clients' },
      { href: '/projects/risk', label: 'Risk View' },
      { href: '/projects/people', label: 'People' },
    ]
  },
  { href: '/calculator', label: 'Calculator', icon: '⊹' },
  { href: '/activity', label: 'Activity', icon: '◉' },
  { href: '/admin/team', label: 'Team', icon: '⊙' },
]

const managerNav = [
  {
    href: '/projects', label: 'Work', icon: '◫',
    children: [
      { href: '/projects/clients', label: 'Clients' },
      { href: '/projects/risk', label: 'Risk View' },
      { href: '/projects/people', label: 'People' },
    ]
  },
  { href: '/my-tasks', label: 'My Tasks', icon: '✓' },
]

const memberNav = [
  { href: '/my-tasks', label: 'My Tasks', icon: '✓' },
]

function getNav(role: string) {
  if (role === 'admin') return adminNav
  if (role === 'project_manager') return managerNav
  return memberNav
}

export default function Sidebar() {
  const pathname = usePathname()
  const [role, setRole] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(
    pathname.startsWith('/finances') ? '/finances' : null
  )

  useEffect(() => {
    fetchRole()
  }, [])

  const fetchRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    setRole(data?.role ?? 'member')
  }

  // Hide sidebar on login page or when not logged in
  if (pathname === '/login' || role === null) return null

  const navItems = getNav(role)

  return (
    <aside style={{
      width: 220,
      background: '#0a0a0a',
      borderRight: '1px solid #1a1a1a',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 20px 24px' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.4px' }}>
          Krufter
        </div>
        <div style={{ fontSize: 11, color: '#3a3a3a', marginTop: 3 }}>business hub</div>
      </div>

      <div style={{ height: 1, background: '#1a1a1a', margin: '0 20px 16px' }} />

      {/* Nav */}
      <nav style={{ padding: '0 10px', flex: 1 }}>
        {navItems.map((item: any) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          const isExpanded = expanded === item.href

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                onClick={() => item.children && setExpanded(isExpanded ? null : item.href)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '8px 12px', marginBottom: 2, borderRadius: 8,
                  fontSize: 13.5, fontWeight: isActive ? 500 : 400,
                  color: isActive ? '#fff' : '#5a5a5a',
                  background: isActive ? '#1e1e22' : 'transparent',
                  transition: 'all 0.15s', cursor: 'pointer',
                }}
              >
                <span style={{
                  fontSize: 13, color: isActive ? '#1488fc' : '#3a3a3a',
                  width: 18, textAlign: 'center' as const,
                }}>{item.icon}</span>
                {item.label}
                {item.children && (
                  <span style={{
                    marginLeft: 'auto', fontSize: 9, color: '#3a3a3a',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
                    transition: 'transform 0.2s', display: 'inline-block',
                  }}>▶</span>
                )}
              </Link>

              {item.children && isExpanded && (
                <div style={{ marginLeft: 18, marginBottom: 4 }}>
                  <div style={{ borderLeft: '1px solid #1e1e22', paddingLeft: 12 }}>
                    {item.children.map((child: any) => {
                      const childActive = pathname === child.href
                      return (
                        <Link key={child.href} href={child.href} style={{
                          display: 'block', padding: '7px 10px', marginBottom: 1,
                          borderRadius: 6, fontSize: 13,
                          color: childActive ? '#fff' : '#4a4a4a',
                          background: childActive ? '#1e1e22' : 'transparent',
                          transition: 'all 0.15s',
                        }}>
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Role badge at bottom */}
      <div style={{ padding: '16px 20px 24px', borderTop: '1px solid #1a1a1a' }}>
        <div style={{ fontSize: 11, color: '#2a2a2a', marginBottom: 3 }}>logged in as</div>
        <div style={{
          fontSize: 12, color: '#3a3a3a', textTransform: 'capitalize',
          padding: '3px 0',
        }}>{role}</div>
      </div>
    </aside>
  )
}