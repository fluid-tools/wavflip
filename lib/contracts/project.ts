import { z } from 'zod'
import { createSelectSchema, createInsertSchema } from 'drizzle-zod'
import { project, track, trackVersion } from '@/db/schema/vault'

export const ProjectRowSchema = createSelectSchema(project)
export const ProjectInsertSchema = createInsertSchema(project)
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
export type Project = z.infer<typeof ProjectRowSchema>

// Input for creating a project (server supplies id/timestamps)
const AccessTypeSchema = z.enum(['private', 'public', 'invite-only'])

export const ProjectCreateDataSchema = ProjectInsertSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  accessType: AccessTypeSchema.optional(),
})


