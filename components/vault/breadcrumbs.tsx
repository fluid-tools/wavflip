"use client"

import { usePathname } from 'next/navigation'
import Link from "next/link"
import { ChevronRight } from 'lucide-react'
import { useFolderPath } from '@/hooks/data/use-vault'
import { useProject } from '@/hooks/data/use-project'

interface FolderPathItem {
  id: string
  name: string
  parentFolderId: string | null
}

export function VaultBreadcrumbs() {
  const pathname = usePathname()

  // Parse the current route for vault breadcrumbs
  const isRoot = pathname === '/vault'
  const isFolder = pathname.startsWith('/vault/folders/') && pathname.split('/').length >= 4
  const isProject = pathname.startsWith('/vault/projects/') && pathname.split('/').length >= 4

  // Extract IDs from pathname
  const folderId = isFolder ? pathname.split('/')[3] : null
  const projectId = isProject ? pathname.split('/')[3] : null

  // Only fetch data when actually needed
  const { data: folderPathData } = useFolderPath(folderId)
  
  // Only fetch project data when on project page
  const { project: projectData } = useProject({
    projectId: projectId || '',
    initialData: undefined,
    enabled: isProject && !!projectId
  })
  


  if (!pathname.includes('/vault')) {
    return null
  }

  if (isRoot) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-foreground font-medium">Vault</span>
      </div>
    )
  }

  if (isFolder) {
    const folderPath = folderPathData?.path || []

    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/vault" className="hover:text-foreground">
          Vault
        </Link>
        {folderPath.map((folder: FolderPathItem, index: number) => (
          <div key={folder.id} className="flex items-center gap-2">
            <ChevronRight className="h-3 w-3" />
            {index === folderPath.length - 1 ? (
              <span className="text-foreground font-medium">{folder.name}</span>
            ) : (
              <Link
                href={`/vault/folders/${folder.id}`}
                className="hover:text-foreground"
              >
                {folder.name}
              </Link>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (isProject) {
    const projectName = projectData?.name || 'Project'
    const parentFolderId = projectData?.folderId

    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/vault" className="hover:text-foreground">
          Vault
        </Link>
        {parentFolderId && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/vault/folders/${parentFolderId}`} className="hover:text-foreground">
              Folder
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{projectName}</span>
      </div>
    )
  }

  return null
} 