'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const roles = ['admin', 'project_manager', 'writer', 'sales', 'developer', 'freelancer']

const roleColors: Record<string, string> = {
  admin: '#1488fc',
  project_manager: '#818cf8',
  writer: '#4ade80',
  sales: '#fbbf24',
  developer: '#f87171',
  freelancer: '#a78bfa',
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

const card = {
  background: '#1e1e22',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
  padding: '24px 26px',
  boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
}

export default function AdminTeamPage() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // New member form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('writer')
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('writer')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')

  useEffect(() => { fetchProfiles() }, [])

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setProfiles(data ?? [])
    setLoading(false)
  }

  const createMember = async () => {
    if (!name || !email || !password) return setFormError('All fields required')
    setCreating(true)
    setFormError('')

    // Create auth user via Supabase admin
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    })

    if (error) { setFormError(error.message); setCreating(false); return }

    // Update role
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ role, full_name: name })
        .eq('id', data.user.id)
    }

    setFormSuccess(`Account created for ${name}. They can now log in.`)
    setName(''); setEmail(''); setPassword(''); setRole('writer')
    setCreating(false)
    setShowForm(false)
    fetchProfiles()
  }

  const sendInvite = async () => {
    if (!inviteEmail) return
    setInviting(true)
    setInviteMsg('')
    const { error } = await supabase.auth.resetPasswordForEmail(inviteEmail, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (error) { setInviteMsg('Error: ' + error.message) }
    else { setInviteMsg(`Invite sent to ${inviteEmail}`) }
    setInviting(false)
    setInviteEmail('')
  }

  const updateRole = async (id: string, newRole: string) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', id)
    fetchProfiles()
  }

  const resetPassword = async (email: string) => {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    alert(`Password reset email sent to ${email}`)
  }

  return (
    <div style={{ maxWidth: 880 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px' }}>Team</h1>
          <p style={{ fontSize: 14, color: '#5a5a5a', marginTop: 8 }}>{profiles.length} members</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: '10px 20px', background: '#1488fc',
          border: 'none', borderRadius: 999,
          boxShadow: '0 0 20px rgba(20,136,252,0.3)',
          cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#fff',
          fontFamily: 'inherit',
        }}>+ Create Account</button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ ...card, marginBottom: 20, border: '1px solid rgba(20,136,252,0.2)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 20 }}>
            Create Team Member Account
          </div>
          {formError && (
            <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 14 }}>
              {formError}
            </div>
          )}
          {formSuccess && (
            <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#4ade80', marginBottom: 14 }}>
              {formSuccess}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Full Name</div>
              <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Sara Ahmed" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Email</div>
              <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="sara@krufter.com" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Temporary Password</div>
              <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Role</div>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={role} onChange={e => setRole(e.target.value)}>
                {roles.map(r => <option key={r} value={r} style={{ background: '#1e1e22', textTransform: 'capitalize' }}>{r}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={createMember} disabled={creating} style={{
              padding: '10px 20px', background: '#1488fc', border: 'none', borderRadius: 999,
              cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#fff', fontFamily: 'inherit',
            }}>{creating ? 'Creating...' : 'Create Account'}</button>
            <button onClick={() => setShowForm(false)} style={{
              padding: '10px 20px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999,
              cursor: 'pointer', fontSize: 13, color: '#5a5a5a', fontFamily: 'inherit',
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Invite by email */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Send Invite Link</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#4a4a4a', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Email Address</div>
            <input style={inputStyle} type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="team@example.com" />
          </div>
          <button onClick={sendInvite} disabled={inviting} style={{
            padding: '10px 20px', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999,
            cursor: 'pointer', fontSize: 13, color: '#e8e8e8', fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}>{inviting ? 'Sending...' : 'Send Invite'}</button>
        </div>
        {inviteMsg && (
          <div style={{ fontSize: 12, color: '#4ade80', marginTop: 10 }}>{inviteMsg}</div>
        )}
      </div>

      {/* Team list */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 20 }}>All Members</div>
        {loading ? (
          <div style={{ fontSize: 13, color: '#4a4a4a' }}>Loading...</div>
        ) : profiles.length === 0 ? (
          <div style={{ fontSize: 13, color: '#4a4a4a' }}>No team members yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {profiles.map((p) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: 8,
                background: 'rgba(255,255,255,0.02)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: '#2a2a2a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 600, color: '#fff',
                    flexShrink: 0,
                  }}>
                    {(p.full_name || p.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>
                      {p.full_name || 'Unnamed'}
                    </div>
                    <div style={{ fontSize: 12, color: '#5a5a5a' }}>{p.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <select
                    value={p.role}
                    onChange={e => updateRole(p.id, e.target.value)}
                    style={{
                      background: '#141416',
                      border: `1px solid ${roleColors[p.role] ?? '#2a2a2a'}40`,
                      borderRadius: 999, padding: '4px 10px',
                      color: roleColors[p.role] ?? '#e8e8e8',
                      fontSize: 12, cursor: 'pointer',
                      fontFamily: 'inherit', outline: 'none',
                    }}
                  >
                    {roles.map(r => (
                      <option key={r} value={r} style={{ background: '#1e1e22' }}>{r}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => resetPassword(p.email)}
                    style={{
                      padding: '5px 12px',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 999, cursor: 'pointer',
                      fontSize: 12, color: '#5a5a5a', fontFamily: 'inherit',
                    }}
                  >Reset Password</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}