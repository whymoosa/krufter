'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const inputStyle = {
  background: '#141416',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  padding: '11px 14px',
  color: '#e8e8e8',
  fontSize: 14,
  width: '100%',
  outline: 'none',
  fontFamily: 'inherit',
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) return setError('Please enter email and password')
    setLoading(true)
    setError('')
  
    console.log('Step 1: Attempting login for', email)
  
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email, password
    })
  
    console.log('Step 2: Auth result:', { data, error: authError })
  
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }
  
    if (!data.user) {
      setError('No user returned')
      setLoading(false)
      return
    }
  
    console.log('Step 3: User ID:', data.user.id)
  
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()
  
    console.log('Step 4: Profile result:', { profile, profileError })
  
    const role = profile?.role ?? 'member'
    console.log('Step 5: Role is:', role, '— redirecting now')
  
    if (role === 'admin' || role === 'project_manager') {
      window.location.replace('/')
    } else {
      window.location.replace('/my-tasks')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'radial-gradient(circle at 60% 20%, rgba(20,136,252,0.06) 0%, transparent 50%)',
    }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 20px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            fontSize: 28, fontWeight: 700, color: '#fff',
            letterSpacing: '-0.5px', marginBottom: 8,
          }}>Krufter</div>
          <div style={{ fontSize: 14, color: '#5a5a5a' }}>Sign in to your account</div>
        </div>

        {/* Card */}
        <div style={{
          background: '#1e1e22',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14,
          padding: 28,
          boxShadow: '0 2px 40px rgba(0,0,0,0.4)',
        }}>
          {error && (
            <div style={{
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: 8, padding: '10px 14px',
              fontSize: 13, color: '#f87171', marginBottom: 16,
            }}>{error}</div>
          )}

          <div style={{ marginBottom: 14 }}>
            <div style={{
              fontSize: 11, color: '#4a4a4a',
              textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7
            }}>Email</div>
            <input
              style={inputStyle}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="you@example.com"
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 11, color: '#4a4a4a',
              textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7
            }}>Password</div>
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: loading ? '#0f6fd4' : '#1488fc',
              border: 'none', borderRadius: 999,
              boxShadow: '0 0 20px rgba(20,136,252,0.3)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 500, color: '#fff',
              fontFamily: 'inherit', transition: 'all 0.2s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#3a3a3a' }}>
          Contact your admin if you need access
        </div>
      </div>
    </div>
  )
}