'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/',          label: 'Dashboard',  icon: '▦' },
  { href: '/invoices',  label: 'Invoices',   icon: '◈' },
  { href: '/finances',  label: 'Finances',   icon: '◉' },
  { href: '/clients',   label: 'Clients',    icon: '◎' },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside style={{
      width: 220, background: '#0d1220',
      borderRight: '1px solid #1e2a3a',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid #1e2a3a' }}>
        <div style={{
          fontSize: 22, fontWeight: 800,
          background: 'linear-gradient(135deg, #22d3ee, #818cf8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>KRUFTER</div>
        <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Business Hub</div>
      </div>
      <nav style={{ padding: '12px', flex: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 9, marginBottom: 3,
              textDecoration: 'none', fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#fff' : '#6b7280',
              background: isActive ? 'rgba(129,140,248,0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(129,140,248,0.2)' : '1px solid transparent',
            }}>
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}