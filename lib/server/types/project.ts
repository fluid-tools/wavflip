import { z } from 'zod'

const ProjectImageUploadSchema = z.object({
  file: z.instanceof(File),
  projectId: z.string(),
})

export type ProjectImageUpload = z.infer<typeof ProjectImageUploadSchema>

export interface ProjectImageResponse {
  success: boolean
  resourceKey?: string
  error?: string
}