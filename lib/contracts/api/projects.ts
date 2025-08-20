import { z } from 'zod';
import { ProjectWithTracksSchema, TrackVersionSchema, TrackWithVersionsSchema } from '@/lib/contracts/project';

// Allow both Date and ISO string in API payloads
const ZDate = z.union([z.date(), z.string()]).transform((v) =>
  v instanceof Date ? v : new Date(v)
);

const TrackVersionApiSchema = TrackVersionSchema.extend({
  createdAt: ZDate,
});

const TrackWithVersionsApiSchema = TrackWithVersionsSchema.extend({
  createdAt: ZDate,
  versions: z.array(TrackVersionApiSchema),
});

const ProjectWithTracksApiSchema = ProjectWithTracksSchema.extend({
  createdAt: ZDate,
  updatedAt: ZDate,
  tracks: z.array(TrackWithVersionsApiSchema).optional(),
});

export const ProjectMoveFormSchema = z.object({
  projectId: z.string().min(1),
  folderId: z.union([z.string().min(1), z.literal('')]).optional(),
});

export type ProjectMoveForm = z.infer<typeof ProjectMoveFormSchema>;

export const ProjectCreateFormSchema = z.object({
  name: z.string().min(1),
  folderId: z.union([z.string().min(1), z.literal('')]).optional(),
});

export const ProjectRenameFormSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1),
});

export const ProjectDeleteFormSchema = z.object({
  projectId: z.string().min(1),
});

export const ProjectGetResponseSchema = ProjectWithTracksApiSchema;
export type ProjectGetResponse = z.infer<typeof ProjectGetResponseSchema>;

export const ProjectsListResponseSchema = z.array(ProjectWithTracksApiSchema);
export type ProjectsListResponse = z.infer<typeof ProjectsListResponseSchema>;
