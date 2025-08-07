'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getVaultTracks, addTrackToVault, downloadAndStoreAudio, createBlobUrlFromAudioData } from '@/lib/storage/local-vault'
import type { GeneratedSound } from '@/types/audio'
import type { LocalVaultTrack } from '@/lib/storage/local-vault'

// Query keys
export const generationsKeys = {
  all: ['generations'] as const,
  online: () => [...generationsKeys.all, 'online'] as const,
  offline: () => [...generationsKeys.all, 'offline'] as const,
  session: () => [...generationsKeys.all, 'session'] as const,
}

// Hook to fetch generations from the Generations project (online)
export function useOnlineGenerations() {
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
        url: track.activeVersion?.fileUrl || '',
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

// Hook to fetch offline generations from IndexedDB
export function useOfflineGenerations() {
  return useQuery({
    queryKey: generationsKeys.offline(),
    queryFn: async (): Promise<GeneratedSound[]> => {
      const tracks = await getVaultTracks()
      
      // Convert LocalVaultTrack to GeneratedSound
      return tracks
        .filter(track => track.type === 'generated')
        .map(track => {
          // Create blob URL if we have audio data
          let url = track.url
          if (track.audioData && !track.blobUrl) {
            url = createBlobUrlFromAudioData(track.audioData)
          } else if (track.blobUrl) {
            url = track.blobUrl
          }
          
          return {
            id: track.id,
            title: track.title,
            url,
            createdAt: track.createdAt,
            type: 'generated' as const,
            duration: track.duration,
            metadata: track.metadata as any
          } as GeneratedSound
        })
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  })
}

// Hook to manage session generations (current session only)
export function useSessionGenerations() {
  const queryClient = useQueryClient()
  
  // Session storage for current session tracks
  const sessionKey = 'wavflip-session-generations'
  
  const query = useQuery({
    queryKey: generationsKeys.session(),
    queryFn: async (): Promise<GeneratedSound[]> => {
      const sessionData = sessionStorage.getItem(sessionKey)
      if (!sessionData) return []
      
      try {
        return JSON.parse(sessionData)
      } catch {
        return []
      }
    },
    staleTime: 0, // Always fresh
  })
  
  // Mutation to add a generation to the session
  const addToSession = useMutation({
    mutationFn: async (sound: GeneratedSound) => {
      const current = query.data || []
      const updated = [...current, sound]
      sessionStorage.setItem(sessionKey, JSON.stringify(updated))
      
      // Also save to IndexedDB for offline access during this session
      if (sound.url.startsWith('http')) {
        try {
          await downloadAndStoreAudio(sound)
        } catch (error) {
          console.error('Failed to cache for offline:', error)
        }
      }
      
      return updated
    },
    onSuccess: (data) => {
      queryClient.setQueryData(generationsKeys.session(), data)
      // Also invalidate offline query to show the new cached track
      queryClient.invalidateQueries({ queryKey: generationsKeys.offline() })
    }
  })
  
  return {
    sessionGenerations: query.data || [],
    addToSession: addToSession.mutate,
    isLoading: query.isLoading
  }
}

// Combined hook for all generations
export function useGenerations() {
  const online = useOnlineGenerations()
  const offline = useOfflineGenerations()
  const { sessionGenerations, addToSession } = useSessionGenerations()
  
  // Merge and deduplicate generations
  const allGenerations = [
    ...(online.data || []),
    ...(offline.data || []),
    ...sessionGenerations
  ].reduce((acc, sound) => {
    if (!acc.find(s => s.id === sound.id)) {
      acc.push(sound)
    }
    return acc
  }, [] as GeneratedSound[])
  
  // Sort by creation date (newest first)
  allGenerations.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  
  return {
    generations: allGenerations,
    onlineGenerations: online.data || [],
    offlineGenerations: offline.data || [],
    sessionGenerations,
    addToSession,
    isLoading: online.isLoading || offline.isLoading,
    isOnline: navigator.onLine
  }
}