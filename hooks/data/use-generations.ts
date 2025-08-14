'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getVaultTracks, downloadAndStoreAudio, createBlobUrlFromAudioData, removeTrackFromVault } from '@/lib/storage/local-vault'
import type { GeneratedSound } from "@/types/generations"
import type { LocalVaultTrack } from '@/lib/storage/local-vault'
import { generateWaveformData } from '@/lib/audio/waveform-generator'
import { waveformKeys } from '@/hooks/data/use-waveform'
import { jotaiStore } from '@/state/jotai-store'
import type { GenerationsResponse } from '@/types/generations'
import { currentTrackAtom } from '@/state/audio-atoms'
import { vaultKeys } from './keys'

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
      const data: GenerationsResponse = await response.json()

      // Transform tracks to GeneratedSound format
      return data.tracks.map((track) => {
        const meta = (track.metadata ?? {}) as { prompt?: string; model?: string; generationTime?: number }
        return {
          id: track.id,
          key: track.activeVersion?.fileKey || track.id,
          title: track.name,
          url: track.activeVersion?.presignedUrl || '',
          createdAt: new Date(track.createdAt),
          type: 'generated' as const,
          duration: track.activeVersion?.duration ?? undefined,
          metadata: {
            prompt: meta.prompt ?? '',
            model: meta.model ?? 'uploaded',
            generationTime: meta.generationTime,
          },
        }
      })
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
      // Ensure consistent id for vault: prefer key when present
      const normalized: GeneratedSound = { ...sound, id: sound.key || sound.id }
      const local = await downloadAndStoreAudio(normalized)
      // If this is the current track, switch player to blob immediately
      try {
        const current = jotaiStore.get(currentTrackAtom)
        if (current?.id === normalized.id && local.blobUrl && !current.url.startsWith('blob:')) {
          jotaiStore.set(currentTrackAtom, { ...current, url: local.blobUrl })
        }
      } catch {}
      // Optimistically mark offline in cache map
      queryClient.setQueryData(generationsKeys.localCache(), (prev: Map<string, LocalVaultTrack> | undefined) => {
        const next = new Map(prev || [])
        next.set(normalized.id, local)
        return next
      })
      // Persist real waveform peaks to Redis after we have the blob (non-blocking)
      void (async () => {
        try {
          const key = sound.key as string | undefined
          if (!key || !local?.audioData) return
          const wf = await generateWaveformData(local.audioData)
          // DO NOT store placeholder: we have real peaks from blob decode here
          // We still hydrate the query with real peaks immediately
          queryClient.setQueryData(waveformKeys.byKey(key), {
            data: {
              peaks: wf.peaks,
              duration: wf.duration,
              sampleRate: wf.sampleRate,
              channels: wf.channels,
              bits: 16,
            },
            isPlaceholder: false,
            generatedAt: new Date().toISOString(),
            key,
          })
          const res = await fetch(`/api/waveform/${encodeURIComponent(key)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              peaks: wf.peaks,
              duration: wf.duration,
              sampleRate: wf.sampleRate,
              channels: wf.channels,
            })
          })
          if (res.ok) {
            queryClient.invalidateQueries({ queryKey: waveformKeys.byKey(key) })
          }
        } catch (err) {
          console.warn('Failed to persist waveform for offline save:', err)
        }
      })()
      // Invalidate local cache to reflect the new offline track
      queryClient.invalidateQueries({ queryKey: generationsKeys.localCache() })
      // Also refresh storage indicator
      queryClient.invalidateQueries({ queryKey: vaultKeys.storage() })
    }
  })
  
  // Mutation to remove a track from offline storage
  const removeOffline = useMutation({
    mutationFn: async (sound: GeneratedSound) => {
      const id = sound.key || sound.id
      await removeTrackFromVault(id)
      // Optimistically update cache map
      queryClient.setQueryData(generationsKeys.localCache(), (prev: Map<string, LocalVaultTrack> | undefined) => {
        const next = new Map(prev || [])
        next.delete(id)
        return next
      })
      // Invalidate storage estimate
      queryClient.invalidateQueries({ queryKey: vaultKeys.storage() })
      return id
    }
  })
  
  // Mutation to handle new generation
  const addToSession = useMutation({
    mutationFn: async (sound: GeneratedSound) => {
      // Streaming-first: do not auto-save. Just refresh lists and persist peaks in background.
      const id = sound.key || sound.id
      // Background: fetch audio bytes via same-origin proxy, decode, and POST real peaks
      void (async () => {
        try {
          const sourceUrl = `/api/audio/${encodeURIComponent(id)}`
          const res = await fetch(sourceUrl)
          if (!res.ok) return
          const buf = await res.arrayBuffer()
          const wf = await generateWaveformData(buf)
          // Optimistically hydrate query so cards show correct waveform immediately
          queryClient.setQueryData(waveformKeys.byKey(id), {
            data: {
              peaks: wf.peaks,
              duration: wf.duration,
              sampleRate: wf.sampleRate,
              channels: wf.channels,
              bits: 16,
            },
            isPlaceholder: false,
            generatedAt: new Date().toISOString(),
            key: id,
          })
          await fetch(`/api/waveform/${encodeURIComponent(id)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              peaks: wf.peaks,
              duration: wf.duration,
              sampleRate: wf.sampleRate,
              channels: wf.channels,
            })
          })
          queryClient.invalidateQueries({ queryKey: waveformKeys.byKey(id) })
        } catch (e) {
          console.warn('Background waveform persist failed:', e)
        }
      })()

      await queryClient.invalidateQueries({ queryKey: generationsKeys.online() })
      await queryClient.invalidateQueries({ queryKey: generationsKeys.localCache() })
      
      return sound
    }
  })
  
  // Process generations with offline availability
  const generations = (online.data || []).map((sound: GeneratedSound) => {
    // Normalize id to key for consistent offline lookup
    const id = sound.key || sound.id
    const localTrack = localCache.data?.get(id)
    
    // If available offline, use local URL
    let url = sound.url
    if (localTrack) {
      if (localTrack.audioData && !localTrack.blobUrl) {
        url = createBlobUrlFromAudioData(localTrack.audioData)
      } else if (localTrack.blobUrl) {
        url = localTrack.blobUrl
      }
    } else if (!url || (url.startsWith('https://') && !url.startsWith('blob:'))) {
      // Prefer our same-origin streaming proxy using the stored key
      url = `/api/audio/${encodeURIComponent(id)}`
    }
    
    return {
      ...sound,
      id,
      url,
      isOffline: !!localTrack
    }
  })
  
  // Sort by creation date (newest first)
  generations.sort((a: GeneratedSound, b: GeneratedSound) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  
  return {
    generations,
    saveOffline: saveOffline.mutate,
    saveOfflineAsync: saveOffline.mutateAsync,
    removeOffline: removeOffline.mutate,
    removeOfflineAsync: removeOffline.mutateAsync,
    addToSession: addToSession.mutate,
    isLoading: online.isLoading || localCache.isLoading,
    isOnline: navigator.onLine
  }
}