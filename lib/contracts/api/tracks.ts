import { z } from 'zod'
import { TrackWithVersionsSchema } from '@/lib/contracts/track'

// FormData-based schemas for track mutations
export const TrackCreateFormSchema = z.object({
  name: z.string().min(1),
  projectId: z.string().min(1),
  fileKey: z.string().min(1),
  fileSize: z.coerce.number().optional(),
  mimeType: z.string().optional(),
  duration: z.coerce.number().optional(),
})

export const TrackDeleteFormSchema = z.object({
  trackId: z.string().min(1),
})

export const TrackRenameFormSchema = z.object({
  trackId: z.string().min(1),
  name: z.string().min(1),
})

export const TrackMoveFormSchema = z.object({
  trackId: z.string().min(1),
  projectId: z.string().min(1),
})

export const TrackCreateResponseSchema = z.object({
  success: z.boolean(),
  track: TrackWithVersionsSchema,
})

export const TrackDeleteResponseSchema = z.object({ success: z.boolean() })
export const TrackRenameResponseSchema = z.object({ success: z.boolean() })

export const TrackDeleteFormSchemaV2 = TrackDeleteFormSchema
export const TrackRenameFormSchemaV2 = TrackRenameFormSchema
export const TrackMoveFormSchemaV2 = TrackMoveFormSchema

export type TrackCreateForm = z.infer<typeof TrackCreateFormSchema>
export type TrackDeleteForm = z.infer<typeof TrackDeleteFormSchema>
export type TrackRenameForm = z.infer<typeof TrackRenameFormSchema>
export type TrackMoveForm = z.infer<typeof TrackMoveFormSchema>

