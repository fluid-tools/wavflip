import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/server/auth'
import { getProjectWithTracks, getVaultProjects, getAllUserFolders } from '@/lib/server/vault'
import { getPresignedImageUrl } from '@/lib/storage/s3-storage'
import { ProjectView } from './client'
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'
import type { ProjectWithTracks } from '@/db/schema/vault'

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

  const project = queryClient.getQueryData<ProjectWithTracks>(['vault', 'projects', projectId])
  
  if (!project) notFound()

  // Prefetch presigned image URL if project has an image
  if (project.image) {
    await queryClient.prefetchQuery({
      queryKey: [['vault', 'projects', projectId], 'presigned-image'],
      queryFn: () => getPresignedImageUrl(project.image!, projectId),
      staleTime: 60 * 1000, // 1 minute
    })
  }

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

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectView projectId={projectId} />
    </HydrationBoundary>
  )
} 