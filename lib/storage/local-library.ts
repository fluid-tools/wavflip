import { get, set, del } from 'idb-keyval'
import type { AudioTrack } from '@/types/audio'

const LIBRARY_KEY_PREFIX = 'wavflip-track-'
const LIBRARY_INDEX_KEY = 'wavflip-library-index'

export interface LibraryTrack extends AudioTrack {
  audioData?: ArrayBuffer // Store audio data locally
  blobUrl?: string // Temporary blob URL for playback
}

// Get all tracks from library
export async function getLibraryTracks(): Promise<LibraryTrack[]> {
  try {
    const trackIds = await get(LIBRARY_INDEX_KEY) || []
    const tracks: LibraryTrack[] = []
    
    for (const trackId of trackIds) {
      const track = await get(`${LIBRARY_KEY_PREFIX}${trackId}`)
      if (track) {
        tracks.push(track)
      }
    }
    
    // Sort by creation date (newest first)
    return tracks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (error) {
    console.error('Failed to get library tracks:', error)
    return []
  }
}

// Add track to library
export async function addTrackToLibrary(track: AudioTrack, audioData?: ArrayBuffer): Promise<void> {
  try {
    const libraryTrack: LibraryTrack = {
      ...track,
      audioData
    }
    
    // Store the track
    await set(`${LIBRARY_KEY_PREFIX}${track.id}`, libraryTrack)
    
    // Update the index
    const trackIds = await get(LIBRARY_INDEX_KEY) || []
    if (!trackIds.includes(track.id)) {
      trackIds.push(track.id)
      await set(LIBRARY_INDEX_KEY, trackIds)
    }
  } catch (error) {
    console.error('Failed to add track to library:', error)
    throw new Error('Failed to save track to library')
  }
}

// Remove track from library
export async function removeTrackFromLibrary(trackId: string): Promise<void> {
  try {
    // Remove the track data
    await del(`${LIBRARY_KEY_PREFIX}${trackId}`)
    
    // Update the index
    const trackIds = await get(LIBRARY_INDEX_KEY) || []
    const updatedIds = trackIds.filter((id: string) => id !== trackId)
    await set(LIBRARY_INDEX_KEY, updatedIds)
  } catch (error) {
    console.error('Failed to remove track from library:', error)
    throw new Error('Failed to remove track from library')
  }
}

// Get a specific track from library
export async function getTrackFromLibrary(trackId: string): Promise<LibraryTrack | null> {
  try {
    return await get(`${LIBRARY_KEY_PREFIX}${trackId}`) || null
  } catch (error) {
    console.error('Failed to get track from library:', error)
    return null
  }
}

// Clear entire library
export async function clearLibrary(): Promise<void> {
  try {
    const trackIds = await get(LIBRARY_INDEX_KEY) || []
    
    // Remove all tracks
    for (const trackId of trackIds) {
      await del(`${LIBRARY_KEY_PREFIX}${trackId}`)
    }
    
    // Clear the index
    await del(LIBRARY_INDEX_KEY)
  } catch (error) {
    console.error('Failed to clear library:', error)
    throw new Error('Failed to clear library')
  }
}

// Download audio data from URL and store locally
export async function downloadAndStoreAudio(track: AudioTrack): Promise<LibraryTrack> {
  try {
    const response = await fetch(track.url)
    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.statusText}`)
    }
    
    const audioData = await response.arrayBuffer()
    const libraryTrack: LibraryTrack = {
      ...track,
      audioData
    }
    
    await addTrackToLibrary(libraryTrack, audioData)
    return libraryTrack
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

export interface LibraryStats {
  totalTracks: number
  totalSize: number
  totalDuration: number
  generatedTracks: number
  uploadedTracks: number
}

// Get library stats
export async function getLibraryStats(): Promise<LibraryStats> {
  try {
    const tracks = await getLibraryTracks()
    
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
    console.error('Failed to get library stats:', error)
    return {
      totalTracks: 0,
      totalSize: 0,
      totalDuration: 0,
      generatedTracks: 0,
      uploadedTracks: 0
    }
  }
}