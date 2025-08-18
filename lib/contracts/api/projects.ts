import { z } from 'zod'

export const ProjectMoveFormSchema = z.object({
  projectId: z.string().min(1),
  folderId: z.union([z.string().min(1), z.literal('')]).optional(),
})

export type ProjectMoveForm = z.infer<typeof ProjectMoveFormSchema>

export const ProjectCreateFormSchema = z.object({
  name: z.string().min(1),
  folderId: z.union([z.string().min(1), z.literal('')]).optional(),
})

export const ProjectRenameFormSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1),
})

export const ProjectDeleteFormSchema = z.object({
  projectId: z.string().min(1),
})

