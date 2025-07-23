export interface AudioTrack {
  id: string
  title: string
  url: string
  duration?: number
  waveform?: number[][]
  createdAt: Date
  type: 'generated' | 'uploaded'
  metadata?: {
    prompt?: string
    model?: string
    voice?: string
  }
}

export interface GeneratedSound extends AudioTrack {
  type: 'generated'
  metadata: {
    prompt: string
    model: string
    generationTime: number
  }
}

export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

export interface PlayerControls {
  play: () => void
  pause: () => void
  stop: () => void
  seekTo: (progress: number) => void
  setVolume: (volume: number) => void
}