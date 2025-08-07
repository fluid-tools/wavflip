'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getVaultTracks, downloadAndStoreAudio, createBlobUrlFromAudioData } from '@/lib/storage/local-vault'
import type { GeneratedSound } from '@/types/audio'
import type { LocalVaultTrack } from '@/lib/storage/local-vault'

// Query keys
export const generationsKeys = {
  all: ['generations'] as const,
  online: () => [...generationsKeys.all, 'online'] as const,
  localCache: () => [...generationsKeys.all, 'local-cache'] as const,
}

// Hook to fetch generations from the Generations project (online) - SINGLE SOURCE OF TRUTH
function useOnlineGenerations() {
  return useQuery({
    queryKey: generationsKeys.online(),
    queryFn: async (): Promise<GeneratedSound[]> => {
      const response = await fetch('/api/vault/generations')
      if (!response.ok) {
        // If not authenticated or no generations, return empty array
        if (response.status === 401 || response.status === 404) {
          return []
        }
        throw new Error('Failed to fetch generations')
      }
      const data = await response.json()
      
      // Transform tracks to GeneratedSound format
      return data.tracks.map((track: any) => ({
        id: track.id,
        title: track.name,
        url: track.activeVersion?.presignedUrl || track.activeVersion?.fileUrl || '', // Use presigned URL if available
        createdAt: new Date(track.createdAt),
        type: 'generated' as const,
        duration: track.activeVersion?.duration,
        metadata: {
          prompt: track.metadata?.prompt || '',
          model: track.metadata?.model || 'unknown',
          generationTime: track.metadata?.generationTime
        }
      }))
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// Hook to check which tracks are available offline
function useLocalCache() {
  return useQuery({
    queryKey: generationsKeys.localCache(),
    queryFn: async (): Promise<Map<string, LocalVaultTrack>> => {
      const tracks = await getVaultTracks()
      const cacheMap = new Map<string, LocalVaultTrack>()
      
      // Create a map of track ID to local track data
      tracks.forEach(track => {
        if (track.type === 'generated') {
          cacheMap.set(track.id, track)
        }
      })
      
      return cacheMap
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  })
}

// Main hook that combines online data with offline availability
export function useGenerations() {
  const queryClient = useQueryClient()
  const online = useOnlineGenerations()
  const localCache = useLocalCache()
  
  // Mutation to save a track offline
  const saveOffline = useMutation({
    mutationFn: async (sound: GeneratedSound) => {
      await downloadAndStoreAudio(sound)
      // Invalidate local cache to reflect the new offline track
      queryClient.invalidateQueries({ queryKey: generationsKeys.localCache() })
    }
  })
  
  // Mutation to handle new generation (auto-save offline)
  const addToSession = useMutation({
    mutationFn: async (sound: GeneratedSound) => {
      // Save to IndexedDB for offline access
      if (sound.url.startsWith('http')) {
        try {
          await downloadAndStoreAudio(sound)
        } catch (error) {
          console.error('Failed to cache for offline:', error)
        }
      }
      
      // Invalidate queries to refetch
      await queryClient.invalidateQueries({ queryKey: generationsKeys.online() })
      await queryClient.invalidateQueries({ queryKey: generationsKeys.localCache() })
      
      return sound
    }
  })
  
  // Process generations with offline availability
  const generations = (online.data || []).map(sound => {
    const localTrack = localCache.data?.get(sound.id)
    
    // If available offline, use local URL
    let url = sound.url
    if (localTrack) {
      if (localTrack.audioData && !localTrack.blobUrl) {
        url = createBlobUrlFromAudioData(localTrack.audioData)
      } else if (localTrack.blobUrl) {
        url = localTrack.blobUrl
      }
    }
    
    return {
      ...sound,
      url,
      isOffline: !!localTrack
    }
  })
  
  // Sort by creation date (newest first)
  generations.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  
  return {
    generations,
    saveOffline: saveOffline.mutate,
    addToSession: addToSession.mutate,
    isLoading: online.isLoading || localCache.isLoading,
    isOnline: navigator.onLine
  }
}