import { z } from 'zod'
import { createSelectSchema, createInsertSchema } from 'drizzle-zod'
import { track, trackVersion } from '@/db/schema/vault'

const TrackRowSchema = createSelectSchema(track)
export const TrackVersionRowSchema = createSelectSchema(trackVersion)
export const TrackInsertSchema = createInsertSchema(track)
export const TrackVersionInsertSchema = createInsertSchema(trackVersion)

export const TrackVersionSchema = TrackVersionRowSchema

export const TrackWithVersionsSchema = TrackRowSchema.extend({
  versions: z.array(TrackVersionSchema),
  activeVersion: TrackVersionSchema.optional(),
})

export type TrackWithVersions = z.infer<typeof TrackWithVersionsSchema>
export type TrackRow = z.infer<typeof TrackRowSchema>
export type TrackVersionRow = z.infer<typeof TrackVersionRowSchema>

// Inputs for creating records (server supplies id/version/timestamps)
const AccessTypeSchema = z.enum(['private', 'public', 'invite-only'])

export const TrackCreateDataSchema = TrackInsertSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  accessType: AccessTypeSchema.optional(),
})
export const TrackVersionCreateDataSchema = TrackVersionInsertSchema.omit({
  id: true,
  version: true,
  createdAt: true,
})

export type TrackCreateData = z.infer<typeof TrackCreateDataSchema>
export type TrackVersionCreateData = z.infer<typeof TrackVersionCreateDataSchema>


