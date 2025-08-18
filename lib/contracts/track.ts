import { z } from 'zod'
import { createSelectSchema } from 'drizzle-zod'
import { track, trackVersion } from '@/db/schema/vault'

export const TrackRowSchema = createSelectSchema(track)
export const TrackVersionRowSchema = createSelectSchema(trackVersion)

export const TrackVersionSchema = TrackVersionRowSchema

export const TrackWithVersionsSchema = TrackRowSchema.extend({
  versions: z.array(TrackVersionSchema),
  activeVersion: TrackVersionSchema.optional(),
})

export type TrackWithVersions = z.infer<typeof TrackWithVersionsSchema>


