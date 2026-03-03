import { supabase } from './supabase'

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export async function getCurrentRole(): Promise<string | null> {
  const profile = await getCurrentUser()
  return profile?.role ?? null
}

export function isAdmin(role: string | null) {
  return role === 'admin'
}

export function isTeamMember(role: string | null) {
  return ['project_manager', 'writer', 'sales', 'developer', 'freelancer'].includes(role ?? '')
}