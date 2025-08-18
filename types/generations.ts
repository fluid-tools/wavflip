import type { ProjectWithTracks, TrackVersion, TrackWithVersions } from '@/lib/contracts/project'
// Note: TrackVersion is also exported from contracts/track, but re-exported by contracts/project
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


