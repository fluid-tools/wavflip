import type { ProjectWithTracks, TrackVersion, TrackWithVersions } from '@/db/schema/vault'
import type { AudioTrack } from './audio'

export type WithPresignedUrl<T extends TrackVersion> = T & { presignedUrl?: string }

export type GenerationsResponse = Omit<ProjectWithTracks, 'tracks'> & {
  tracks: Array<
    Omit<TrackWithVersions, 'activeVersion'> & {
      activeVersion?: WithPresignedUrl<TrackVersion>
    }
  >
}

export type GeneratedSound = AudioTrack & {
  type: 'generated'
  metadata: {
    prompt: string
    model: string
    generationTime?: number
  }
  isOffline?: boolean // Added to track offline availability
}


