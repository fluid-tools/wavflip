export interface ProjectImageUpload {
  file: File
  projectId: string
}

export interface ProjectImageResponse {
  success: boolean
  imageUrl?: string
  error?: string
}