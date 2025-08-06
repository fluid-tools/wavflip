'use client'

import Image from 'next/image'
import { useProject } from '@/hooks/data/use-project'

interface FolderPreviewImageProps {
  projectId: string
  projectName: string
  imageKey: string | null | undefined
  sizes?: string
  className?: string
}

// Component for displaying project images in folder preview grids
export function FolderPreviewImage({ 
  projectId, 
  projectName, 
  imageKey,
  sizes = "(max-width: 640px) 80px, (max-width: 768px) 90px, (max-width: 1024px) 100px, 120px",
  className = "object-cover"
}: FolderPreviewImageProps) {
  // Use the same hook as ProjectCard for consistency
  // We only need the presignedImageUrl, not the full project data
  const { presignedImageUrl: presignedUrl } = useProject({ 
    projectId,
    enabled: !!imageKey // Only fetch if there's an image
  })
  
  if (!imageKey) {
    // No image: show initial in colored circle
    return (
      <div className="w-full h-full bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 flex items-center justify-center">
        <span className="text-green-600 dark:text-green-400 font-semibold text-xs">
          {projectName.charAt(0).toUpperCase()}
        </span>
      </div>
    )
  }
  
  if (!presignedUrl) {
    // Image exists but no presigned URL yet: show loading placeholder
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center animate-pulse">
        <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">
          {projectName.charAt(0).toUpperCase()}
        </span>
      </div>
    )
  }
  
  return (
    <Image
      src={presignedUrl}
      alt={projectName}
      fill
      className={className}
      sizes={sizes}
      priority
    />
  )
}