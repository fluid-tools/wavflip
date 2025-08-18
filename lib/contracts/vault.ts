import { z } from 'zod'
import { createSelectSchema } from 'drizzle-zod'
import { folder, project } from '@/db/schema/vault'

// Base row schemas derived from Drizzle
const FolderRowSchema = createSelectSchema(folder).pick({
  id: true,
  name: true,
  parentFolderId: true,
})

const ProjectRowSchema = createSelectSchema(project).pick({
  id: true,
  name: true,
})

export const BreadcrumbItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentFolderId: z.string().nullable(),
})

export const VaultProjectSchema = ProjectRowSchema.extend({
  trackCount: z.number(),
})

export const VaultStatsSchema = z.object({
  totalFolders: z.number(),
  totalProjects: z.number(),
  totalTracks: z.number(),
  totalVersions: z.number(),
  totalSize: z.number(),
  totalDuration: z.number(),
})

// Recursive folder schema composed from base row + aggregates
type VaultFolderT = {
  id: string
  name: string
  parentFolderId: string | null
  projects: z.infer<typeof VaultProjectSchema>[]
  subfolders: VaultFolderT[]
  projectCount: number
  subFolderCount: number
  level?: number
}

export const VaultFolderSchema: z.ZodType<VaultFolderT> = z.lazy(() =>
  FolderRowSchema.extend({
    projects: z.array(VaultProjectSchema),
    subfolders: z.array(VaultFolderSchema),
    projectCount: z.number(),
    subFolderCount: z.number(),
    level: z.number().optional(),
  })
)

export const VaultDataSchema = z.object({
  folders: z.array(VaultFolderSchema),
  rootProjects: z.array(VaultProjectSchema),
  path: z.array(BreadcrumbItemSchema).optional(),
  stats: VaultStatsSchema.optional(),
})

export type VaultProject = z.infer<typeof VaultProjectSchema>
export type VaultFolder = z.infer<typeof VaultFolderSchema>
export type VaultData = z.infer<typeof VaultDataSchema>
export type BreadcrumbItem = z.infer<typeof BreadcrumbItemSchema>
export type VaultStats = z.infer<typeof VaultStatsSchema>


