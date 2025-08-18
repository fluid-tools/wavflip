'use client'

import { useQuery, useQueries } from '@tanstack/react-query'
import type { TrackWithVersions } from '@/lib/contracts/track'

// Query keys
export const trackUrlKeys = {
  all: ['track-urls'] as const,
  single: (trackId: string) => [...trackUrlKeys.all, trackId] as const,
  project: (projectId: string) => [...trackUrlKeys.all, 'project', projectId] as const,
}

// Single track presigned URL
export function useTrackPresignedUrl(trackId: string | null) {
  return useQuery({
    queryKey: trackId ? trackUrlKeys.single(trackId) : ['disabled'],
    queryFn: async () => {
      const response = await fetch(`/api/tracks/${trackId}/presigned-url`)
      if (!response.ok) {
        throw new Error('Failed to get presigned URL')
      }
      const data = await response.json()
      return data.url as string
    },
    enabled: !!trackId,
    staleTime: 50 * 60 * 1000, // 50 minutes (less than 1 hour expiry)
    gcTime: 55 * 60 * 1000, // Keep in cache for 55 minutes
    refetchInterval: 45 * 60 * 1000, // Refresh every 45 minutes to ensure fresh URLs
  })
}

// Multiple track presigned URLs (for a project)
export function useProjectTrackUrls(tracks: TrackWithVersions[] | undefined) {
  const trackIds = tracks?.map(t => t.id) || []
  
  const queries = useQueries({
    queries: trackIds.map(trackId => ({
      queryKey: trackUrlKeys.single(trackId),
      queryFn: async () => {
        const response = await fetch(`/api/tracks/${trackId}/presigned-url`)
        if (!response.ok) {
          throw new Error('Failed to get presigned URL')
        }
        const data = await response.json()
        return data.url as string
      },
      staleTime: 50 * 60 * 1000,
      gcTime: 55 * 60 * 1000,
      refetchInterval: 45 * 60 * 1000,
    }))
  })
  
  // Create a map of trackId to presigned URL
  const urlMap = new Map<string, string>()
  trackIds.forEach((trackId, index) => {
    const query = queries[index]
    if (query?.data) {
      urlMap.set(trackId, query.data)
    }
  })
  
  return {
    urlMap,
    isLoading: queries.some(q => q.isLoading),
    isError: queries.some(q => q.isError),
  }
}

