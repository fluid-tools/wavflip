import { ReactNode } from 'react'
import { getServerSession } from '@/lib/server/auth'
import { getOrCreateGenerationsProject } from '@/lib/server/vault/generations'
import { getPresignedUrl } from '@/lib/storage/s3-storage'
import { REDIS_KEYS } from '@/lib/redis'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import type { TrackVersion, TrackWithVersions } from '@/db/schema/vault'
import type { GeneratedSound } from "@/types/generations"

interface StudioLayoutProps {
  children: ReactNode
}

export default async function StudioLayout({ children }: StudioLayoutProps) {
  const queryClient = new QueryClient()
  
  // Prefetch generations project if user is authenticated
  const session = await getServerSession()
  
  if (session?.user?.id) {
    await queryClient.prefetchQuery({
      queryKey: ['generations', 'online'] as const,
      queryFn: async (): Promise<GeneratedSound[]> => {
        try {
          const generationsProject = await getOrCreateGenerationsProject(session.user.id)
          
          // Generate presigned URLs for all tracks
          const tracksWithUrls = await Promise.all(
            (generationsProject.tracks || []).map(async (track) => {
              if (track.activeVersion?.fileKey) {
                try {
                  const cacheKey = REDIS_KEYS.presignedTrack(track.id)
                  const presignedUrl = await getPresignedUrl(
                    track.activeVersion.fileKey, 
                    cacheKey, 
                    60 * 60 // 1 hour
                  )
                  return {
                    ...track,
                    activeVersion: {
                      ...track.activeVersion,
                      presignedUrl
                    }
                  }
                } catch (error) {
                  console.error(`Failed to generate presigned URL for track ${track.id}:`, error)
                  return track
                }
              }
              return track
            })
          )
          
          // Transform tracks to GeneratedSound format
          return tracksWithUrls.map((track: TrackWithVersions & { activeVersion?: (TrackVersion & { presignedUrl?: string }) }) => {
            const meta = (track.metadata ?? {}) as Record<string, unknown>
            return {
              id: track.id,
              key: track.activeVersion?.fileKey || track.id,
              title: track.name,
              url: track.activeVersion?.presignedUrl || '',
              createdAt: new Date(track.createdAt),
              type: 'generated' as const,
              duration: track.activeVersion?.duration ?? undefined,
              metadata: {
                prompt: typeof meta.prompt === 'string' ? meta.prompt : '',
                model: typeof meta.model === 'string' ? meta.model : 'unknown',
                generationTime: typeof meta.generationTime === 'number' ? meta.generationTime : undefined,
              }
            }
          })
        } catch (error) {
          console.error('Failed to prefetch generations:', error)
          return []
        }
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="h-full w-full overflow-hidden">
        {children}
      </div>
    </HydrationBoundary>
  )
} 