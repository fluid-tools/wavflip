"use client"

import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from "next/link"
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { CreateProjectDialog } from './projects/create-dialog'
import { CreateFolderDialog } from './folders/create-dialog'

interface FolderPathItem {
  id: string
  name: string
  parentFolderId: string | null
}

interface LibraryBreadcrumbsProps {
  showActions?: boolean
}

export function LibraryBreadcrumbs({ showActions = true }: LibraryBreadcrumbsProps) {
  const pathname = usePathname()

  // Parse the current route for library breadcrumbs
  const isRoot = pathname === '/library'
  const isFolder = pathname.startsWith('/library/folders/') && pathname.split('/').length >= 4
  const isProject = pathname.startsWith('/library/projects/') && pathname.split('/').length >= 4
  
  // Extract IDs from pathname
  const folderId = isFolder ? pathname.split('/')[3] : null
  const projectId = isProject ? pathname.split('/')[3] : null

  // Fetch folder path for breadcrumbs (including parent folders)
  const { data: folderPathData } = useQuery({
    queryKey: ['folder-path', folderId],
    queryFn: async () => {
      if (!folderId) return null
      const response = await fetch(`/api/folders/${folderId}/path`)
      if (!response.ok) {
        console.error('Failed to fetch folder path:', response.status, response.statusText)
        throw new Error('Failed to fetch folder path')
      }
      return response.json()
    },
    enabled: !!folderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch project data for breadcrumbs
  const { data: projectData } = useQuery({
    queryKey: ['project-data', projectId],
    queryFn: async () => {
      if (!projectId) return null
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) {
        console.error('Failed to fetch project:', response.status, response.statusText)
        throw new Error('Failed to fetch project')
      }
      return response.json()
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch parent folder data for project breadcrumbs
  const parentFolderId = projectData?.folderId
  const { data: parentFolderData } = useQuery({
    queryKey: ['folder-data', parentFolderId],
    queryFn: async () => {
      if (!parentFolderId) return null
      const response = await fetch(`/api/folders/${parentFolderId}`)
      if (!response.ok) {
        console.error('Failed to fetch parent folder:', response.status, response.statusText)
        throw new Error('Failed to fetch folder')
      }
      return response.json()
    },
    enabled: !!parentFolderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (!pathname.includes('/library')) {
    return null
  }

  if (isRoot) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Organize your tracks in folders and projects
        </div>
      </div>
    )
  }

  if (isFolder) {
    const folderPath = folderPathData?.path || []
    
    // Determine back navigation
    const parentFolder = folderPath[folderPath.length - 2]
    const backHref = parentFolder ? `/library/folders/${parentFolder.id}` : '/library'
    const backText = parentFolder ? `Back to ${parentFolder.name}` : 'Back to Library'
    
    return (
      <div className="flex items-center justify-between flex-1">
        <div className="flex items-center gap-4">
          <Link href={backHref}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {backText}
            </Button>
          </Link>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/library" className="hover:text-foreground">
              Library
            </Link>
            {folderPath.map((folder: FolderPathItem, index: number) => (
              <div key={folder.id} className="flex items-center gap-2">
                <ChevronRight className="h-3 w-3" />
                {index === folderPath.length - 1 ? (
                  <span className="text-foreground font-medium">{folder.name}</span>
                ) : (
                  <Link 
                    href={`/library/folders/${folder.id}`} 
                    className="hover:text-foreground"
                  >
                    {folder.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {showActions && folderId && (
          <div className="flex gap-2">
            <CreateFolderDialog parentFolderId={folderId} triggerText="New Folder" />
            <CreateProjectDialog folderId={folderId} triggerText="New Project" />
          </div>
        )}
      </div>
    )
  }

  if (isProject) {
    const projectName = projectData?.name || 'Project'
    const parentFolderName = parentFolderData?.name || 'Folder'
    const backHref = parentFolderId ? `/library/folders/${parentFolderId}` : '/library'
    const backText = parentFolderId ? 'Back to Folder' : 'Back to Library'
    
    return (
      <div className="flex items-center gap-4">
        <Link href={backHref}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backText}
          </Button>
        </Link>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/library" className="hover:text-foreground">
            Library
          </Link>
          {parentFolderId && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link href={`/library/folders/${parentFolderId}`} className="hover:text-foreground">
                {parentFolderName}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{projectName}</span>
        </div>
      </div>
    )
  }

  return null
} 