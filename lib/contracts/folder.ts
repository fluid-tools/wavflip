import { z } from 'zod'
import { createSelectSchema } from 'drizzle-zod'
import { folder, project, track } from '@/db/schema/vault'

export const FolderRowSchema = createSelectSchema(folder)
export const ProjectRowSchema = createSelectSchema(project)
export const TrackRowSchema = createSelectSchema(track)

export const ProjectSummarySchema = ProjectRowSchema.extend({
  trackCount: z.number().optional(),
})

type FolderWithProjectsT = z.infer<typeof FolderRowSchema> & {
  projects: z.infer<typeof ProjectSummarySchema>[]
  subFolders?: FolderWithProjectsT[]
  subFolderCount?: number
  projectCount?: number
}

export const FolderWithProjectsSchema: z.ZodType<FolderWithProjectsT> = z.lazy(() =>
  FolderRowSchema.extend({
    projects: z.array(ProjectSummarySchema),
    subFolders: z.array(FolderWithProjectsSchema).optional(),
    subFolderCount: z.number().optional(),
    projectCount: z.number().optional(),
  })
)

export type FolderWithProjects = z.infer<typeof FolderWithProjectsSchema>


