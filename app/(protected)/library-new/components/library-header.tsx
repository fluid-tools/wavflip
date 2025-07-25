'use client'

import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { CreateProjectDialog } from './create-project-dialog'
import { CreateFolderDialog } from './create-folder-dialog'

interface FolderPathItem {
  id: string
  name: string
  parentFolderId: string | null
}

export function LibraryHeader() {
  const pathname = usePathname()
  
  // Parse the current route
  const isRoot = pathname === '/library-new'
  const isFolder = pathname.startsWith('/library-new/folders/')
  const isProject = pathname.startsWith('/library-new/projects/')
  
  // Extract IDs from pathname
  const folderId = isFolder ? pathname.split('/')[3] : null
  const projectId = isProject ? pathname.split('/')[3] : null

  // Fetch folder path for breadcrumbs (including parent folders)
  const { data: folderPathData } = useQuery({
    queryKey: ['folder-path', folderId],
    queryFn: async () => {
      if (!folderId) return null
      const response = await fetch(`/api/folders/${folderId}/path`)
      if (!response.ok) throw new Error('Failed to fetch folder path')
      return response.json()
    },
    enabled: !!folderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch project data for breadcrumbs
  const { data: projectData } = useQuery({
    queryKey: ['project-name', projectId],
    queryFn: async () => {
      if (!projectId) return null
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) throw new Error('Failed to fetch project')
      return response.json()
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (isRoot) {
    return (
      <div className="p-6 border-b">
        <div>
          <h1 className="text-2xl font-semibold">Library</h1>
          <p className="text-muted-foreground">
            Organize your tracks in folders and projects
          </p>
        </div>
      </div>
    )
  }

  if (isFolder) {
    const folderPath = folderPathData?.path || []
    
    // Determine back navigation
    const parentFolder = folderPath[folderPath.length - 2]
    const backHref = parentFolder ? `/library-new/folders/${parentFolder.id}` : '/library-new'
    const backText = parentFolder ? `Back to ${parentFolder.name}` : 'Library'
    
    return (
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={backHref}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {backText}
              </Button>
            </Link>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/library-new" className="hover:text-foreground">
                Library
              </Link>
                             {folderPath.map((folder: FolderPathItem, index: number) => (
                <div key={folder.id} className="flex items-center gap-2">
                  <ChevronRight className="h-3 w-3" />
                  {index === folderPath.length - 1 ? (
                    <span className="text-foreground font-medium">{folder.name}</span>
                  ) : (
                    <Link 
                      href={`/library-new/folders/${folder.id}`} 
                      className="hover:text-foreground"
                    >
                      {folder.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {folderId && (
            <div className="flex gap-2">
              <CreateFolderDialog parentFolderId={folderId} triggerText="New Folder" />
              <CreateProjectDialog folderId={folderId} triggerText="New Project" />
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isProject) {
    const projectName = projectData?.name || 'Project'
    const parentFolderId = projectData?.folderId
    const backHref = parentFolderId ? `/library-new/folders/${parentFolderId}` : '/library-new'
    const backText = parentFolderId ? 'Back to Folder' : 'Library'
    
    return (
      <div className="p-6 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href={backHref}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {backText}
            </Button>
          </Link>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/library-new" className="hover:text-foreground">
              Library
            </Link>
            {parentFolderId && (
              <>
                <ChevronRight className="h-3 w-3" />
                <Link href={`/library-new/folders/${parentFolderId}`} className="hover:text-foreground">
                  Folder
                </Link>
              </>
            )}
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{projectName}</span>
          </div>
        </div>
      </div>
    )
  }

  return null
} 