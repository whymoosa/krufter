import { supabase } from '@/lib/supabase'
import WorkView from './workview'

export default async function ProjectsPage() {
  const [
    { data: milestones },
    { data: profiles },
  ] = await Promise.all([
    supabase
      .from('pm_milestones')
      .select('*, pm_projects(id, name, priority, client_id, pm_clients(name))')
      .neq('status', 'approved')
      .order('due_date', { ascending: true }),
    supabase.from('profiles').select('id, full_name, email'),
  ])

  return <WorkView milestones={milestones ?? []} profiles={profiles ?? []} />
}