import { get, set, del } from 'idb-keyval'
import type { AudioTrack } from '@/types/audio'

const VAULT_KEY_PREFIX = 'wavflip-track-'
const VAULT_INDEX_KEY = 'wavflip-vault-index'

export interface LocalVaultTrack extends AudioTrack {
  audioData?: ArrayBuffer // Store audio data locally
  blobUrl?: string // Temporary blob URL for playback
  mimeType?: string // Original content type
}

// Get all tracks from vault
export async function getVaultTracks(): Promise<LocalVaultTrack[]> {
  try {
    const trackIds = await get(VAULT_INDEX_KEY) || []
    const tracks: LocalVaultTrack[] = []
    
    for (const trackId of trackIds) {
      const track = await get(`${VAULT_KEY_PREFIX}${trackId}`) as LocalVaultTrack | undefined
      if (track) {
        // Blob URLs are ephemeral; always regenerate in-memory if audioData exists
        if (track.audioData) {
          try {
            track.blobUrl = createBlobUrlFromAudioData(track.audioData, track.mimeType || 'audio/mpeg')
          } catch {}
        } else {
          track.blobUrl = undefined
        }
        // Normalize id to stored key to keep consistent
        const id = (track as unknown as { key?: string; id: string }).key || track.id
        tracks.push({ ...track, id })
      }
    }
    
    // Sort by creation date (newest first)
    return tracks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (error) {
    console.error('Failed to get vault tracks:', error)
    return []
  }
}

// Add track to vault
export async function addTrackToVault(track: AudioTrack, audioData?: ArrayBuffer, mimeType?: string): Promise<void> {
  try {
    // Persist audioData; do NOT persist blobUrl (ephemeral)
    const vaultTrack: LocalVaultTrack = { ...track, audioData, blobUrl: undefined, mimeType }
    const vaultId = (track as any).key ?? track.id
    
    // Store the track
    await set(`${VAULT_KEY_PREFIX}${vaultId}`, vaultTrack)
    
    // Update the index
    const trackIds = await get(VAULT_INDEX_KEY) || []
    if (!trackIds.includes(vaultId)) {
      trackIds.push(vaultId)
      await set(VAULT_INDEX_KEY, trackIds)
    }
  } catch (error) {
    console.error('Failed to add track to vault:', error)
    throw new Error('Failed to save track to vault')
  }
}

// Remove track from vault
export async function removeTrackFromVault(trackId: string): Promise<void> {
  try {
    // Revoke blob URL if present (best-effort)
    const existing = (await get(`${VAULT_KEY_PREFIX}${trackId}`)) as LocalVaultTrack | undefined
    if (existing?.blobUrl) {
      try { revokeBlobUrl(existing.blobUrl) } catch {}
    }
    // Remove the track data
    await del(`${VAULT_KEY_PREFIX}${trackId}`)
    
    // Update the index
    const trackIds = await get(VAULT_INDEX_KEY) || []
    const updatedIds = trackIds.filter((id: string) => id !== trackId)
    await set(VAULT_INDEX_KEY, updatedIds)
  } catch (error) {
    console.error('Failed to remove track from vault:', error)
    throw new Error('Failed to remove track from vault')
  }
}

// Get a specific track from vault
export async function getTrackFromVault(trackId: string): Promise<LocalVaultTrack | null> {
  try {
    const t = (await get(`${VAULT_KEY_PREFIX}${trackId}`)) as LocalVaultTrack | undefined
    if (!t) return null
    if (t.audioData) {
      try { t.blobUrl = createBlobUrlFromAudioData(t.audioData, t.mimeType || 'audio/mpeg') } catch {}
    } else {
      t.blobUrl = undefined
    }
    const id = (t as unknown as { key?: string; id: string }).key || t.id
    return { ...t, id }
  } catch (error) {
    console.error('Failed to get track from vault:', error)
    return null
  }
}

// Clear entire vault
export async function clearVault(): Promise<void> {
  try {
    const trackIds = await get(VAULT_INDEX_KEY) || []
    
    // Remove all tracks
    for (const trackId of trackIds) {
      await del(`${VAULT_KEY_PREFIX}${trackId}`)
    }
    
    // Clear the index
    await del(VAULT_INDEX_KEY)
  } catch (error) {
    console.error('Failed to clear vault:', error)
    throw new Error('Failed to clear vault')
  }
}

// Download audio data from URL and store locally
export async function downloadAndStoreAudio(track: AudioTrack): Promise<LocalVaultTrack> {
  try {
    const response = await fetch(track.url)
    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.statusText}`)
    }
    
    const audioData = await response.arrayBuffer()
    const contentType = response.headers.get('Content-Type') || 'audio/mpeg'
    const blobUrl = createBlobUrlFromAudioData(audioData, contentType)
    const vaultTrack: LocalVaultTrack = { ...track, audioData, blobUrl, mimeType: contentType }
    
    await addTrackToVault(vaultTrack, audioData, contentType)
    return vaultTrack
  } catch (error) {
    console.error('Failed to download and store audio:', error)
    throw new Error('Failed to download audio for offline storage')
  }
}

// Create blob URL from stored audio data
export function createBlobUrlFromAudioData(audioData: ArrayBuffer, contentType = 'audio/mpeg'): string {
  const blob = new Blob([audioData], { type: contentType })
  return URL.createObjectURL(blob)
}

// Revoke blob URL to free memory
export function revokeBlobUrl(url: string): void {
  URL.revokeObjectURL(url)
}

interface VaultStats {
  totalTracks: number
  totalSize: number
  totalDuration: number
  generatedTracks: number
  uploadedTracks: number
}

// Get vault stats
export async function getVaultStats(): Promise<VaultStats> {
  try {
    const tracks = await getVaultTracks()
    
    let totalSize = 0
    let totalDuration = 0
    let generatedTracks = 0
    let uploadedTracks = 0
    
    for (const track of tracks) {
      if (track.audioData) {
        totalSize += track.audioData.byteLength
      }
      
      if (track.duration) {
        totalDuration += track.duration
      }
      
      if (track.type === 'generated') {
        generatedTracks++
      } else {
        uploadedTracks++
      }
    }
    
    return {
      totalTracks: tracks.length,
      totalSize,
      totalDuration,
      generatedTracks,
      uploadedTracks
    }
  } catch (error) {
    console.error('Failed to get vault stats:', error)
    return {
      totalTracks: 0,
      totalSize: 0,
      totalDuration: 0,
      generatedTracks: 0,
      uploadedTracks: 0
    }
  }
}