'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: '⊞' },
  {
    href: '/finances', label: 'Finances', icon: '◈',
    children: [
      { href: '/finances/income/new', label: 'Log Income' },
      { href: '/finances/expenses/new', label: 'Log Expense' },
    ]
  },
  { href: '/invoices', label: 'Invoices', icon: '⊠' },
  { href: '/calculator', label: 'Calculator', icon: '⊹' },
  { href: '/clients', label: 'Clients', icon: '⊙' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<string | null>(
    pathname.startsWith('/finances') ? '/finances' : null
  )

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
        <div style={{
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '-0.4px',
          color: '#fff',
        }}>Krufter</div>
        <div style={{ fontSize: 11, color: '#3a3a3a', marginTop: 3, letterSpacing: '0.02em' }}>
          business hub
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: '#1a1a1a', margin: '0 20px 16px' }} />

      {/* Nav */}
      <nav style={{ padding: '0 10px', flex: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          const isExpanded = expanded === item.href

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                onClick={() => item.children && setExpanded(isExpanded ? null : item.href)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '8px 12px',
                  marginBottom: 2,
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? '#fff' : '#5a5a5a',
                  background: isActive ? '#1e1e22' : 'transparent',
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                }}
              >
                <span style={{
                  fontSize: 13,
                  color: isActive ? '#1488fc' : '#3a3a3a',
                  width: 18,
                  textAlign: 'center' as const,
                }}>{item.icon}</span>
                {item.label}
                {item.children && (
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: 9,
                    color: '#3a3a3a',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
                    transition: 'transform 0.2s',
                    display: 'inline-block',
                  }}>▶</span>
                )}
              </Link>

              {item.children && isExpanded && (
                <div style={{ marginLeft: 18, marginBottom: 4 }}>
                  <div style={{ borderLeft: '1px solid #1e1e22', paddingLeft: 12 }}>
                    {item.children.map(child => {
                      const childActive = pathname === child.href
                      return (
                        <Link key={child.href} href={child.href} style={{
                          display: 'block',
                          padding: '7px 10px',
                          marginBottom: 1,
                          borderRadius: 6,
                          fontSize: 13,
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

      {/* Bottom */}
      <div style={{ padding: '16px 20px 24px', borderTop: '1px solid #1a1a1a' }}>
        <div style={{ fontSize: 11, color: '#2a2a2a', marginBottom: 3 }}>signed in as</div>
        <div style={{ fontSize: 12, color: '#3a3a3a' }}>you@krufter.com</div>
      </div>
    </aside>
  )
}