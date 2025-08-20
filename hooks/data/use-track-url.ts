'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import type { TrackWithVersions } from '@/lib/contracts/track';
import { trackUrlKeys } from './keys';

// Single track presigned URL
export function useTrackPresignedUrl(trackId: string | null) {
  return useQuery({
    queryKey: trackId ? trackUrlKeys.single(trackId) : ['disabled'],
    queryFn: async () => {
      const response = await fetch(`/api/tracks/${trackId}/presigned-url`);
      if (!response.ok) {
        throw new Error('Failed to get presigned URL');
      }
      const data = await response.json();
      return data.url as string;
    },
    enabled: !!trackId,
    staleTime: 50 * 60 * 1000, // 50 minutes (less than 1 hour expiry)
    gcTime: 55 * 60 * 1000, // Keep in cache for 55 minutes
    refetchInterval: 45 * 60 * 1000, // Refresh every 45 minutes to ensure fresh URLs
  });
}

// Multiple track presigned URLs (for a project)
export function useProjectTrackUrls(tracks: TrackWithVersions[] | undefined) {
  const allTracks = tracks || [];

  // Pre-populate URL map with local blob URLs for optimistic tracks to avoid network calls
  const urlMap = new Map<string, string>();
  const realTrackIds: string[] = [];

  for (const t of allTracks) {
    const fileKey = t.activeVersion?.fileKey;
    const isTempId = t.id.startsWith('temp-');
    const isBlob = typeof fileKey === 'string' && fileKey.startsWith('blob:');
    if (isTempId || isBlob) {
      const maybeBlob =
        (t.activeVersion?.metadata as any)?.tempBlobUrl || fileKey;
      if (typeof maybeBlob === 'string') {
        urlMap.set(t.id, maybeBlob);
      }
      continue;
    }
    realTrackIds.push(t.id);
  }

  const queries = useQueries({
    queries: realTrackIds.map((trackId) => ({
      queryKey: trackUrlKeys.single(trackId),
      queryFn: async () => {
        const response = await fetch(`/api/tracks/${trackId}/presigned-url`);
        if (!response.ok) {
          throw new Error('Failed to get presigned URL');
        }
        const data = await response.json();
        return data.url as string;
      },
      staleTime: 50 * 60 * 1000,
      gcTime: 55 * 60 * 1000,
      refetchInterval: 45 * 60 * 1000,
    })),
  });

  // Merge fetched URLs into urlMap
  realTrackIds.forEach((trackId, index) => {
    const query = queries[index];
    if (query?.data) {
      urlMap.set(trackId, query.data);
    }
  });

  return {
    urlMap,
    isLoading: queries.some((q) => q.isLoading),
    isError: queries.some((q) => q.isError),
  };
}
