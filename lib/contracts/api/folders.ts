import { z } from 'zod'
import { FolderWithProjectsSchema } from '@/lib/contracts/folder'

export const FolderMoveFormSchema = z.object({
  folderId: z.string().min(1),
  parentFolderId: z.union([z.string().min(1), z.literal('')]),
})

export const FolderGetResponseSchema = FolderWithProjectsSchema

export type FolderMoveForm = z.infer<typeof FolderMoveFormSchema>

export const FolderCreateFormSchema = z.object({
  name: z.string().min(1),
  parentFolderId: z.union([z.string().min(1), z.literal('')]).optional(),
})

export const FolderDeleteFormSchema = z.object({
  folderId: z.string().min(1),
})

