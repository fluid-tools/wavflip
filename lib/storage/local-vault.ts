import { get, set, del } from 'idb-keyval'
import type { AudioTrack } from '@/types/audio'
import { mediaStore } from '@/lib/storage/media-store'

/**
 * Local vault responsibilities (concise):
 * - Persist track metadata in IDB (index + light fields).
 * - Persist bytes in OPFS when available; IDB stores bytes only as fallback.
 * - Never persist blobUrl; always regenerate at runtime from OPFS/IDB.
 */

const VAULT_KEY_PREFIX = 'wavflip-track-'
const VAULT_INDEX_KEY = 'wavflip-vault-index'

export interface LocalVaultTrack extends AudioTrack {
  audioData?: ArrayBuffer // Store audio data locally
  blobUrl?: string // Temporary blob URL for playback
  mimeType?: string // Original content type
  persistedInOPFS?: boolean // Stored bytes in OPFS
}

async function resolvePlaybackUrl(track: LocalVaultTrack): Promise<string | undefined> {
  if (track.audioData) {
    try {
      return createBlobUrlFromAudioData(track.audioData, track.mimeType || 'audio/mpeg')
    } catch {
      return undefined
    }
  }
  if (track.persistedInOPFS) {
    try {
      return (await mediaStore.getUrlForPlayback(track.id)) ?? undefined
    } catch {
      return undefined
    }
  }
  return undefined
}

// Get all tracks from vault
export async function getVaultTracks(): Promise<LocalVaultTrack[]> {
  try {
    const trackIds = await get(VAULT_INDEX_KEY) || []
    const tracks: LocalVaultTrack[] = []
    
    for (const trackId of trackIds) {
      const track = await get(`${VAULT_KEY_PREFIX}${trackId}`) as LocalVaultTrack | undefined
      if (track) {
        // Blob URLs are ephemeral; regenerate from OPFS/IDB as-needed
        track.blobUrl = await resolvePlaybackUrl(track)
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
export async function addTrackToVault(track: AudioTrack, audioData?: ArrayBuffer, mimeType?: string, persistedInOPFS?: boolean): Promise<void> {
  try {
    // Persist audioData; do NOT persist blobUrl (ephemeral)
    const vaultTrack: LocalVaultTrack = { ...track, audioData, blobUrl: undefined, mimeType, persistedInOPFS }
    const vaultId = (track as unknown as { key?: string; id: string }).key ?? track.id
    
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
    t.blobUrl = await resolvePlaybackUrl(t)
    const id = (t as unknown as { key?: string; id: string }).key || t.id
    return { ...t, id }
  } catch (error) {
    console.error('Failed to get track from vault:', error)
    return null
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
    // Primary: store bytes in OPFS when available
    let persistedInOPFS = false
    try {
      if (mediaStore.isOPFSEnabled()) {
        await mediaStore.writeFile(track.id, audioData)
        persistedInOPFS = true
      }
    } catch {}

    const blobUrl = persistedInOPFS ? (await mediaStore.getUrlForPlayback(track.id)) || undefined : createBlobUrlFromAudioData(audioData, contentType)
    const vaultTrack: LocalVaultTrack = { ...track, audioData: persistedInOPFS ? undefined : audioData, blobUrl, mimeType: contentType, persistedInOPFS }

    await addTrackToVault(vaultTrack, persistedInOPFS ? undefined : audioData, contentType, persistedInOPFS)
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
