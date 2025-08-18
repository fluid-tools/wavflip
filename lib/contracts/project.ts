import { z } from 'zod'
import { createSelectSchema } from 'drizzle-zod'
import { project, track, trackVersion } from '@/db/schema/vault'

export const ProjectRowSchema = createSelectSchema(project)
export const TrackRowSchema = createSelectSchema(track)
export const TrackVersionRowSchema = createSelectSchema(trackVersion)

export const TrackVersionSchema = TrackVersionRowSchema

export const TrackWithVersionsSchema = TrackRowSchema.extend({
  versions: z.array(TrackVersionSchema),
  activeVersion: TrackVersionSchema.optional(),
  project: ProjectRowSchema.optional(),
})

export const ProjectWithTracksSchema = ProjectRowSchema.extend({
  tracks: z.array(TrackWithVersionsSchema).optional(),
  trackCount: z.number(),
})

export type ProjectWithTracks = z.infer<typeof ProjectWithTracksSchema>
export type TrackWithVersions = z.infer<typeof TrackWithVersionsSchema>
export type TrackVersion = z.infer<typeof TrackVersionSchema>


