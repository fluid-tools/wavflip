import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/server/auth'
import { getProjectWithTracks, getVaultProjects, getAllUserFolders } from '@/lib/server/vault'
import { ProjectView } from './client'
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'

interface ProjectPageProps {
  params: Promise<{
    projectId: string
  }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const [session, { projectId }] = await Promise.all([
    requireAuth(),
    params
  ])

  if (!projectId) notFound()

  const queryClient = new QueryClient()

  // Prefetch project data using correct query key
  await queryClient.prefetchQuery({
    queryKey: ['vault', 'projects', projectId],
    queryFn: () => getProjectWithTracks(projectId, session.user.id)
  })

  // Prefetch additional data for move operations
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['vault', 'folders'],
      queryFn: () => getAllUserFolders(session.user.id)
    }),
    queryClient.prefetchQuery({
      queryKey: ['vault', 'vault-projects'],
      queryFn: () => getVaultProjects(session.user.id)
    })
  ])

  const project = queryClient.getQueryData(['vault', 'projects', projectId])
  
  if (!project) notFound()

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectView projectId={projectId} />
    </HydrationBoundary>
  )
} 