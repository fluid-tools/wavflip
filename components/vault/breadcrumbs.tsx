"use client"

import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import Link from "next/link"
import { Button } from '@/components/ui/button'
import { ChevronRight, Plus, FolderPlus, Music } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { CreateProjectDialog } from './projects/create-dialog'
import { CreateFolderDialog } from './folders/create-dialog'
import { vaultKeys } from '@/hooks/data/use-vault'

interface FolderPathItem {
  id: string
  name: string
  parentFolderId: string | null
}

interface VaultBreadcrumbsProps {
  showActions?: boolean
}

export function VaultBreadcrumbs({ showActions = true }: VaultBreadcrumbsProps) {
  const pathname = usePathname()
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false)

  // Parse the current route for vault breadcrumbs
  const isRoot = pathname === '/vault'
  const isFolder = pathname.startsWith('/vault/folders/') && pathname.split('/').length >= 4
  const isProject = pathname.startsWith('/vault/projects/') && pathname.split('/').length >= 4
  
  // Extract IDs from pathname
  const folderId = isFolder ? pathname.split('/')[3] : null
  const projectId = isProject ? pathname.split('/')[3] : null

  // Fetch folder path for breadcrumbs (including parent folders) 
  const { data: folderPathData } = useQuery({
    queryKey: [...vaultKeys.folder(folderId!), 'path'],
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

  // Fetch project data for breadcrumbs using vault query keys (synced with mutations)
  const { data: projectData } = useQuery({
    queryKey: vaultKeys.project(projectId!),
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

  // Fetch parent folder data for project breadcrumbs using vault query keys (synced with mutations)
  const parentFolderId = projectData?.folderId
  const { data: parentFolderData } = useQuery({
    queryKey: vaultKeys.folder(parentFolderId!),
    queryFn: async () => {
      if (!parentFolderId) return null
      const response = await fetch(`/api/folders/${parentFolderId}`)
      if (!response.ok) {
        console.error('Failed to fetch parent folder:', response.status, response.statusText)
        throw new Error('Failed to fetch parent folder')
      }
      return response.json()
    },
    enabled: !!parentFolderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (!pathname.includes('/vault')) {
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
    
    return (
      <div className="flex items-center justify-between flex-1">
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
        
        {showActions && folderId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowCreateFolderDialog(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                Create Folder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowCreateProjectDialog(true)}>
                <Music className="h-4 w-4 mr-2" />
                Create Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    )
  }

  if (isProject) {
    const projectName = projectData?.name || 'Project'
    const parentFolderName = parentFolderData?.name || 'Folder'
    
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/vault" className="hover:text-foreground">
          Vault
        </Link>
        {parentFolderId && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/vault/folders/${parentFolderId}`} className="hover:text-foreground">
              {parentFolderName}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{projectName}</span>
      </div>
    )
  }

  return (
    <>
      {/* Controlled Dialogs */}
      <CreateFolderDialog 
        parentFolderId={folderId}
        open={showCreateFolderDialog}
        onOpenChange={setShowCreateFolderDialog}
        onSuccess={() => setShowCreateFolderDialog(false)}
      />
      <CreateProjectDialog 
        folderId={folderId}
        open={showCreateProjectDialog}
        onOpenChange={setShowCreateProjectDialog}
        onSuccess={() => setShowCreateProjectDialog(false)}
      />
    </>
  )
} 