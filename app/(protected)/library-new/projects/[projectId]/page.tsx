import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth-server'
import { getProjectWithTracks } from '@/lib/library-db'
import { ProjectView } from './components/project-view'

interface ProjectPageProps {
  params: Promise<{
    projectId: string
  }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  // Parallelize auth check and params extraction
  const [session, { projectId }] = await Promise.all([
    requireAuth(),
    params
  ])

  if (!projectId) {
    notFound()
  }

  // Fetch project data server-side
  const project = await getProjectWithTracks(projectId, session.user.id)

  if (!project) {
    notFound()
  }

  return (
    <div className="flex flex-col h-full">
      <ProjectView projectId={projectId} initialProject={project} />
    </div>
  )
} 