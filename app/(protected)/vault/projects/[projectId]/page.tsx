import { notFound } from 'next/navigation'
import { getCachedSession } from '@/lib/server/auth'
import { redirect } from 'next/navigation'
import { getProjectWithTracks } from '@/lib/server/vault'
import { getPresignedImageUrl } from '@/lib/storage/s3-storage'
import { ProjectView } from './client'
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'
import type { ProjectWithTracks } from '@/db/schema/vault'
// Remove client-only import

interface ProjectPageProps {
  params: Promise<{
    projectId: string
  }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  // Parallelize session check and params extraction for better performance
  const [session, { projectId }] = await Promise.all([
    getCachedSession(),
    params
  ])

  if (!projectId || !session?.user?.id) redirect('/sign-in')

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 50 * 60 * 1000, // 50 minutes for presigned URLs
        gcTime: 55 * 60 * 1000,
      }
    }
  })

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

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectView projectId={projectId} />
    </HydrationBoundary>
  )
} 