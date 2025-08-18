import { z } from 'zod';
import { FolderWithProjectsSchema } from '@/lib/contracts/folder';

export const FolderMoveFormSchema = z.object({
  folderId: z.string().min(1),
  parentFolderId: z.union([z.string().min(1), z.literal('')]),
});

export const FolderGetResponseSchema = FolderWithProjectsSchema;

// List folders (root-level) response
export const FoldersListResponseSchema = z.array(FolderWithProjectsSchema);
export type FoldersListResponse = z.infer<typeof FoldersListResponseSchema>;

export type FolderMoveForm = z.infer<typeof FolderMoveFormSchema>;

export const FolderCreateFormSchema = z.object({
  name: z.string().min(1),
  parentFolderId: z.union([z.string().min(1), z.literal('')]).optional(),
});

export const FolderDeleteFormSchema = z.object({
  folderId: z.string().min(1),
});

// Server-friendly create schema (no empty string for root)
export const FolderEntityCreateSchema = z.object({
  name: z.string().min(1),
  parentFolderId: z.string().min(1).nullable().optional(),
  userId: z.string().min(1),
  order: z.number().int().default(0),
});
