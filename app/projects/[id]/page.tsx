import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import MilestonesView from './MilestonesView'

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const [{ data: project }, { data: milestones }, { data: profiles }] = await Promise.all([
    supabase
      .from('pm_projects')
      .select('*, pm_clients(name), financial_projects(name)')
      .eq('id', params.id)
      .single(),
    supabase
      .from('pm_milestones')
      .select('*')
      .eq('project_id', params.id)
      .order('due_date', { ascending: true }),
    supabase.from('profiles').select('id, full_name, email'),
  ])

  if (!project) return notFound()

  return <MilestonesView project={project} milestones={milestones ?? []} profiles={profiles ?? []} />
}