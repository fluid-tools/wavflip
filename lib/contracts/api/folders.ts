import { z } from 'zod';
import {
  FolderRowSchema,
  FolderWithProjectsSchema,
  ProjectSummarySchema,
} from '@/lib/contracts/folder';

// Allow both Date objects (server) and ISO strings (client JSON) and coerce to Date
const ZDate = z.union([z.date(), z.string()]).transform((v) =>
  v instanceof Date ? v : new Date(v)
);

// JSON-friendly variants for API responses
const FolderRowApiSchema = FolderRowSchema.extend({
  createdAt: ZDate,
  updatedAt: ZDate,
});

const ProjectSummaryApiSchema = ProjectSummarySchema.extend({
  createdAt: ZDate,
  updatedAt: ZDate,
});

const FolderWithProjectsApiSchema: z.ZodType<z.infer<typeof FolderWithProjectsSchema>> = z.lazy(
  () =>
    FolderRowApiSchema.extend({
      projects: z.array(ProjectSummaryApiSchema),
      subFolders: z.array(FolderWithProjectsApiSchema).optional(),
      subFolderCount: z.number().optional(),
      projectCount: z.number().optional(),
    })
);

export const FolderMoveFormSchema = z.object({
  folderId: z.string().min(1),
  parentFolderId: z.union([z.string().min(1), z.literal('')]),
});

export const FolderGetResponseSchema = FolderWithProjectsApiSchema;

// List folders (root-level) response
export const FoldersListResponseSchema = z.array(FolderWithProjectsApiSchema);
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
