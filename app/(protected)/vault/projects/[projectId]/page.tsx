import { notFound } from 'next/navigation'
import { getServerSession } from '@/lib/server/auth'
import { getProjectWithTracks } from '@/lib/server/vault'
import { getPresignedImageUrl, getPresignedUrl } from '@/lib/storage/s3-storage'
import { ProjectView } from './client'
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'
import type { ProjectWithTracks } from '@/db/schema/vault'
// Remove client-only import
import { REDIS_KEYS } from '@/lib/redis'

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

  // Prefetch presigned URLs for all tracks in parallel
  if (project.tracks && project.tracks.length > 0) {
    await Promise.all(
      project.tracks.map(async (track) => {
        if (track.activeVersion?.fileUrl) {
          // Prefetch presigned URL for each track
          await queryClient.prefetchQuery({
            queryKey: ['track-urls', track.id] as const,
            queryFn: async () => {
              const cacheKey = REDIS_KEYS.presignedTrack(track.id)
              return getPresignedUrl(track.activeVersion!.fileUrl, cacheKey, 60 * 60)
            },
            staleTime: 50 * 60 * 1000,
          })
        }
      })
    )
  }

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