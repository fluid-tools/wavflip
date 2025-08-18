import { z } from 'zod'

export const ProjectMoveFormSchema = z.object({
  projectId: z.string().min(1),
  folderId: z.union([z.string().min(1), z.literal('')]).optional(),
})

export type ProjectMoveForm = z.infer<typeof ProjectMoveFormSchema>

