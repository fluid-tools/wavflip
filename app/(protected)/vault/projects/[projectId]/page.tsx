import { notFound } from 'next/navigation'
import { getServerSession } from '@/lib/server/auth'
import { getProjectWithTracks } from '@/lib/server/vault'
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
  // Parallelize session check and params extraction for better performance
  const [session, { projectId }] = await Promise.all([
    getServerSession(),
    params
  ])

  if (!projectId || !session?.user?.id) notFound()

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

  // Note: Additional data for move operations is already prefetched in the layout

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectView projectId={projectId} />
    </HydrationBoundary>
  )
} 