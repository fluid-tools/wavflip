'use client'

import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { CreateProjectDialog } from './create-project-dialog'

export function LibraryHeader() {
  const pathname = usePathname()
  
  // Parse the current route
  const isRoot = pathname === '/library-new'
  const isFolder = pathname.startsWith('/library-new/folders/')
  const isProject = pathname.startsWith('/library-new/projects/')
  
  // Extract IDs from pathname
  const folderId = isFolder ? pathname.split('/')[3] : null
  const projectId = isProject ? pathname.split('/')[3] : null

  // Fetch folder data for breadcrumbs
  const { data: folderData } = useQuery({
    queryKey: ['folder-name', folderId],
    queryFn: async () => {
      if (!folderId) return null
      const response = await fetch(`/api/folders/${folderId}`)
      if (!response.ok) throw new Error('Failed to fetch folder')
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
    const folderName = folderData?.name || 'Folder'
    
    return (
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/library-new">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Library
              </Button>
            </Link>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/library-new" className="hover:text-foreground">
                Library
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{folderName}</span>
            </div>
          </div>
          
          {folderId && <CreateProjectDialog folderId={folderId} />}
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