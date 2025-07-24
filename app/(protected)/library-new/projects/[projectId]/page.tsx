import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth-server'
import { ProjectView } from './components/project-view'

interface ProjectPageProps {
  params: Promise<{
    projectId: string
  }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await requireAuth()
  const { projectId } = await params

  if (!projectId) {
    notFound()
  }

  return (
    <div className="flex flex-col h-full">
      <ProjectView projectId={projectId} userId={session.user.id} />
    </div>
  )
} 