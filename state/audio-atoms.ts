import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { AudioTrack, PlayerState, GeneratedSound } from '@/types/audio'

// Current playing track
export const currentTrackAtom = atom<AudioTrack | null>(null)

// Player state
export const playerStateAtom = atom<PlayerState>('idle')

// Current playback time and duration
export const currentTimeAtom = atom<number>(0)
export const durationAtom = atom<number>(0)

// Volume (0-1)
export const volumeAtom = atomWithStorage('wavflip-volume', 0.8)

// Muted state
export const mutedAtom = atom<boolean>(false)

// Playback rate
export const playbackRateAtom = atom<number>(1)

// Playlist of all tracks
export const playlistAtom = atomWithStorage<AudioTrack[]>('wavflip-playlist', [])

// Generated sounds (subset of playlist)
export const generatedSoundsAtom = atom<GeneratedSound[]>((get) => {
  const playlist = get(playlistAtom)
  return playlist.filter((track): track is GeneratedSound => track.type === 'generated')
})

// Currently generating sound
export const isGeneratingAtom = atom<boolean>(false)

// Generation progress (0-1)
export const generationProgressAtom = atom<number>(0)

// Player controls actions
export const playerControlsAtom = atom(
  null,
  (get, set, action: { type: string; payload?: any }) => {
    switch (action.type) {
      case 'PLAY_TRACK':
        set(currentTrackAtom, action.payload)
        set(playerStateAtom, 'loading')
        break
        
      case 'PLAY':
        set(playerStateAtom, 'playing')
        break
        
      case 'PAUSE':
        set(playerStateAtom, 'paused')
        break
        
      case 'STOP':
        set(playerStateAtom, 'idle')
        set(currentTimeAtom, 0)
        break
        
      case 'SET_TIME':
        set(currentTimeAtom, action.payload)
        break
        
      case 'SET_DURATION':
        set(durationAtom, action.payload)
        break
        
      case 'SET_VOLUME':
        set(volumeAtom, action.payload)
        break
        
      case 'TOGGLE_MUTE':
        set(mutedAtom, (prev) => !prev)
        break
        
      case 'SET_PLAYBACK_RATE':
        set(playbackRateAtom, action.payload)
        break
        
      case 'ADD_TO_PLAYLIST':
        set(playlistAtom, (prev) => [...prev, action.payload])
        break
        
      case 'REMOVE_FROM_PLAYLIST':
        set(playlistAtom, (prev) => prev.filter(track => track.id !== action.payload))
        break
        
      case 'CLEAR_PLAYLIST':
        set(playlistAtom, [])
        break
        
      case 'START_GENERATION':
        set(isGeneratingAtom, true)
        set(generationProgressAtom, 0)
        break
        
      case 'UPDATE_GENERATION_PROGRESS':
        set(generationProgressAtom, action.payload)
        break
        
      case 'FINISH_GENERATION':
        set(isGeneratingAtom, false)
        set(generationProgressAtom, 0)
        if (action.payload) {
          set(playlistAtom, (prev) => [...prev, action.payload])
        }
        break
        
      case 'ERROR':
        set(playerStateAtom, 'error')
        set(isGeneratingAtom, false)
        break
    }
  }
)

// Derived atoms for UI
export const isPlayingAtom = atom((get) => get(playerStateAtom) === 'playing')
export const isLoadingAtom = atom((get) => get(playerStateAtom) === 'loading')
export const hasCurrentTrackAtom = atom((get) => get(currentTrackAtom) !== null)

// Progress percentage (0-100)
export const progressPercentageAtom = atom((get) => {
  const currentTime = get(currentTimeAtom)
  const duration = get(durationAtom)
  return duration > 0 ? (currentTime / duration) * 100 : 0
})