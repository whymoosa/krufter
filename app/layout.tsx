import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/header'

export const metadata: Metadata = {
  title: 'Krufter',
  description: 'Business Management Hub',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
          <Sidebar />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Header />
            <main style={{
              flex: 1, overflowY: 'auto',
              padding: '36px 44px',
              background: '#0f0f0f',
              position: 'relative',
            }}>
              <div style={{
                position: 'fixed', top: 0, right: 0,
                width: 600, height: 600,
                background: 'radial-gradient(circle at top right, rgba(20,136,252,0.06) 0%, transparent 60%)',
                pointerEvents: 'none', zIndex: 0,
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}