"use client"

import { usePathname } from 'next/navigation'
import React from 'react'
import { useVaultSidebar } from '@/hooks/data/use-vault'
import Link from "next/link"
import { 
  FolderOpen, 
  Folder, 
  Music, 
  ChevronDown, 
  ChevronRight,
  Plus,
  FolderPlus,
  Edit2,
  Trash2,
  Move
} from 'lucide-react'
import { useState, startTransition } from 'react'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarMenuAction,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { CreateFolderDialog } from '@/components/vault/folders/create-dialog'
import { CreateProjectDialog } from '@/components/vault/projects/create-dialog'
import { FolderPicker } from '@/components/vault/folders/picker'
import { useDeleteFolderAction, useRenameFolderAction, useMoveFolderAction, useDeleteProjectAction, useRenameProjectAction, useMoveProjectAction } from '@/actions/use-vault-action'
import { useContextMenuHandler } from '@/hooks/use-context-menu-handler'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SidebarFolder {
  id: string
  name: string
  parentFolderId: string | null
  projects: Array<{
    id: string
    name: string
    trackCount: number
  }>
  subfolders: SidebarFolder[]
  projectCount: number
  subFolderCount: number
}



export function VaultSidebarNavigation() {
  const pathname = usePathname()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false)

  // Context menu dialogs state
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string; type: 'folder' | 'project'; parentId?: string | null } | null>(null)
  const [newName, setNewName] = useState('')
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null)

  // Use the new vault hooks
  const { data: vaultData, isLoading } = useVaultSidebar()
  const { shouldShowContextMenu } = useContextMenuHandler()

  // Action hooks
  const [, deleteFolderAction, isDeletingFolder] = useDeleteFolderAction({
    onSuccess: () => {
      setShowDeleteDialog(false)
      setSelectedItem(null)
    }
  })
  const [, renameFolderAction, isRenamingFolder] = useRenameFolderAction({
    onSuccess: () => {
      setShowRenameDialog(false)
      setSelectedItem(null)
      setNewName('')
    }
  })
  const [, moveFolderAction, isMovingFolder] = useMoveFolderAction({
    onSuccess: () => {
      setShowMoveDialog(false)
      setSelectedItem(null)
      setSelectedDestinationId(null)
    }
  })
  const [, deleteProjectAction, isDeletingProject] = useDeleteProjectAction({
    onSuccess: () => {
      setShowDeleteDialog(false)
      setSelectedItem(null)
    }
  })
  const [, renameProjectAction, isRenamingProject] = useRenameProjectAction({
    onSuccess: () => {
      setShowRenameDialog(false)
      setSelectedItem(null)
      setNewName('')
    }
  })
  const [, moveProjectAction, isMovingProject] = useMoveProjectAction({
    onSuccess: () => {
      setShowMoveDialog(false)
      setSelectedItem(null)
      setSelectedDestinationId(null)
    }
  })

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  // Context menu handlers
  const handleRename = (item: { id: string; name: string; type: 'folder' | 'project'; parentId?: string | null }) => {
    setSelectedItem(item)
    setNewName(item.name)
    setShowRenameDialog(true)
  }

  const handleDelete = (item: { id: string; name: string; type: 'folder' | 'project'; parentId?: string | null }) => {
    setSelectedItem(item)
    setShowDeleteDialog(true)
  }

  const handleMove = (item: { id: string; name: string; type: 'folder' | 'project'; parentId?: string | null }) => {
    setSelectedItem(item)
    setSelectedDestinationId(item.parentId || null)
    setShowMoveDialog(true)
  }

  // Form handlers
  const handleRenameSubmit = async (formData: FormData) => {
    if (!selectedItem) return
    
    if (selectedItem.type === 'folder') {
      formData.append('folderId', selectedItem.id)
      startTransition(() => {
        renameFolderAction(formData)
      })
    } else {
      formData.append('projectId', selectedItem.id)
      startTransition(() => {
        renameProjectAction(formData)
      })
    }
  }

  const handleDeleteSubmit = async (formData: FormData) => {
    if (!selectedItem) return
    
    if (selectedItem.type === 'folder') {
      formData.append('folderId', selectedItem.id)
      startTransition(() => {
        deleteFolderAction(formData)
      })
    } else {
      formData.append('projectId', selectedItem.id)
      startTransition(() => {
        deleteProjectAction(formData)
      })
    }
  }

  const handleMoveSubmit = async (formData: FormData) => {
    if (!selectedItem) return
    
    if (selectedItem.type === 'folder') {
      formData.append('folderId', selectedItem.id)
      formData.append('parentFolderId', selectedDestinationId || '')
      formData.append('sourceParentFolderId', selectedItem.parentId || '')
      startTransition(() => {
        moveFolderAction(formData)
      })
    } else {
      formData.append('projectId', selectedItem.id)
      formData.append('folderId', selectedDestinationId || '')
      formData.append('sourceFolderId', selectedItem.parentId || '')
      startTransition(() => {
        moveProjectAction(formData)
      })
    }
  }

  const renderFolder = (folder: SidebarFolder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const isActive = pathname === `/vault/folders/${folder.id}`
    const hasSubItems = (folder.subfolders && folder.subfolders.length > 0) || folder.projects.length > 0

    const shouldShowSubItems = hasSubItems

    const folderContextMenu = shouldShowContextMenu() ? (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <SidebarMenuButton asChild isActive={isActive}>
            <Link href={`/vault/folders/${folder.id}`}>
              <Folder className="h-4 w-4" />
              <span>{folder.name}</span>
            </Link>
          </SidebarMenuButton>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem
            onClick={(e) => {
              e.preventDefault()
              handleRename({ id: folder.id, name: folder.name, type: 'folder', parentId: folder.parentFolderId })
            }}
          >
            <Edit2 className="h-4 w-4" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            onClick={(e) => {
              e.preventDefault()
              handleMove({ id: folder.id, name: folder.name, type: 'folder', parentId: folder.parentFolderId })
            }}
          >
            <Move className="h-4 w-4" />
            Move to Folder
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            variant="destructive"
            onClick={(e) => {
              e.preventDefault()
              handleDelete({ id: folder.id, name: folder.name, type: 'folder', parentId: folder.parentFolderId })
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ) : (
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={`/vault/folders/${folder.id}`}>
          <Folder className="h-4 w-4" />
          <span>{folder.name}</span>
        </Link>
      </SidebarMenuButton>
    )

    return (
      <div key={folder.id}>
        <SidebarMenuItem>
          {folderContextMenu}
          
          {shouldShowSubItems && (
            <SidebarMenuAction onClick={() => toggleFolder(folder.id)}>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </SidebarMenuAction>
          )}
        </SidebarMenuItem>
        
        {shouldShowSubItems && isExpanded && (
          <SidebarMenuSub>
            {/* Render real projects in this folder */}
            {folder.projects.map((project) => {
              const projectContextMenu = shouldShowContextMenu() ? (
                <ContextMenu>
                  <ContextMenuTrigger asChild>
                    <SidebarMenuSubButton 
                      asChild 
                      isActive={pathname === `/vault/projects/${project.id}`}
                    >
                      <Link href={`/vault/projects/${project.id}`}>
                        <Music className="h-4 w-4" />
                        <span>{project.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {project.trackCount}
                        </span>
                      </Link>
                    </SidebarMenuSubButton>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-48">
                    <ContextMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        handleRename({ id: project.id, name: project.name, type: 'project', parentId: folder.id })
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                      Rename
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        handleMove({ id: project.id, name: project.name, type: 'project', parentId: folder.id })
                      }}
                    >
                      <Move className="h-4 w-4" />
                      Move to Folder
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      variant="destructive"
                      onClick={(e) => {
                        e.preventDefault()
                        handleDelete({ id: project.id, name: project.name, type: 'project', parentId: folder.id })
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ) : (
                <SidebarMenuSubButton 
                  asChild 
                  isActive={pathname === `/vault/projects/${project.id}`}
                >
                  <Link href={`/vault/projects/${project.id}`}>
                    <Music className="h-4 w-4" />
                    <span>{project.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {project.trackCount}
                    </span>
                  </Link>
                </SidebarMenuSubButton>
              )

              return (
                <SidebarMenuSubItem key={project.id}>
                  {projectContextMenu}
                </SidebarMenuSubItem>
              )
            })}
            
            {/* Render real subfolders recursively */}
            {folder.subfolders.map((subfolder) => 
              renderFolder(subfolder, level + 1)
            )}
          </SidebarMenuSub>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Vault</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <Folder className="h-4 w-4" />
                <span>Loading...</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  if (!vaultData) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Vault</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <FolderOpen className="h-4 w-4" />
                <span>No content yet</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  const { folders = [], rootProjects = [] } = vaultData

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
        Vault
      </SidebarGroupLabel>
      
      {/* Quick create action - proper sidebar style */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarGroupAction title="Add Folder or Project">
            <Plus />
            <span className="sr-only">Add Folder or Project</span>
          </SidebarGroupAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
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
      
      <SidebarGroupContent>
        <SidebarMenu>
          {/* Root level projects */}
          {rootProjects.map((project) => {
            const rootProjectContextMenu = shouldShowContextMenu() ? (
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === `/vault/projects/${project.id}`}
                  >
                    <Link href={`/vault/projects/${project.id}`}>
                      <Music className="h-4 w-4" />
                      <span>{project.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {project.trackCount}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  <ContextMenuItem
                    onClick={(e) => {
                      e.preventDefault()
                      handleRename({ id: project.id, name: project.name, type: 'project', parentId: null })
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                    Rename
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={(e) => {
                      e.preventDefault()
                      handleMove({ id: project.id, name: project.name, type: 'project', parentId: null })
                    }}
                  >
                    <Move className="h-4 w-4" />
                    Move to Folder
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    variant="destructive"
                    onClick={(e) => {
                      e.preventDefault()
                      handleDelete({ id: project.id, name: project.name, type: 'project', parentId: null })
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ) : (
              <SidebarMenuButton 
                asChild 
                isActive={pathname === `/vault/projects/${project.id}`}
              >
                <Link href={`/vault/projects/${project.id}`}>
                  <Music className="h-4 w-4" />
                  <span>{project.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {project.trackCount}
                  </span>
                </Link>
              </SidebarMenuButton>
            )

            return (
              <SidebarMenuItem key={project.id}>
                {rootProjectContextMenu}
              </SidebarMenuItem>
            )
          })}
          
          {/* Root level folders */}
          {folders.map((folder: SidebarFolder) => renderFolder(folder))}
          
          {/* Empty state */}
          {folders.length === 0 && rootProjects.length === 0 && (
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <FolderOpen className="h-4 w-4" />
                <span>No content yet</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>

      {/* Dialogs triggered by dropdown */}
      <CreateFolderDialog 
        open={showCreateFolderDialog}
        onOpenChange={setShowCreateFolderDialog}
        onSuccess={() => setShowCreateFolderDialog(false)}
      />
      <CreateProjectDialog 
        open={showCreateProjectDialog}
        onOpenChange={setShowCreateProjectDialog}
        onSuccess={() => setShowCreateProjectDialog(false)}
      />

      {/* Context menu dialogs */}
      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <form action={handleRenameSubmit}>
            <DialogHeader>
              <DialogTitle>Rename {selectedItem?.type === 'folder' ? 'Folder' : 'Project'}</DialogTitle>
              <DialogDescription>
                Enter a new name for this {selectedItem?.type === 'folder' ? 'folder' : 'project'}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="col-span-3"
                  autoFocus
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRenameDialog(false)}
                disabled={isRenamingFolder || isRenamingProject}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={(isRenamingFolder || isRenamingProject) || !newName.trim()}>
                {(isRenamingFolder || isRenamingProject) ? 'Renaming...' : 'Rename'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <form action={handleDeleteSubmit}>
            <DialogHeader>
              <DialogTitle>Delete {selectedItem?.type === 'folder' ? 'Folder' : 'Project'}</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{selectedItem?.name}&quot;? 
                {selectedItem?.type === 'folder' 
                  ? ' This will also delete all projects and tracks inside it.' 
                  : ' This will also delete all tracks and versions inside it.'
                } This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeletingFolder || isDeletingProject}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="destructive" 
                disabled={isDeletingFolder || isDeletingProject}
              >
                {(isDeletingFolder || isDeletingProject) ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <form action={handleMoveSubmit}>
            <DialogHeader>
              <DialogTitle>Move {selectedItem?.type === 'folder' ? 'Folder' : 'Project'}</DialogTitle>
              <DialogDescription>
                Choose where to move &quot;{selectedItem?.name}&quot;.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <FolderPicker
                selectedFolderId={selectedDestinationId}
                onFolderSelect={setSelectedDestinationId}
                excludeFolderId={selectedItem?.type === 'folder' ? selectedItem.id : undefined}
                allowVaultSelection={true}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMoveDialog(false)}
                disabled={isMovingFolder || isMovingProject}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isMovingFolder || isMovingProject}>
                {(isMovingFolder || isMovingProject) ? 'Moving...' : 'Move'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarGroup>
  )
} 