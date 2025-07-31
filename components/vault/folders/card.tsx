'use client'

import { useState } from 'react'
import { Folder, Edit2, Trash2, FolderOpen } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
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
import { useDeleteFolderAction, useRenameFolderAction, useMoveFolderAction } from '@/actions/use-vault-action'
import type { FolderWithProjects } from '@/db/schema/vault'
import Link from 'next/link'
import { DraggableWrapper } from '@/components/vault/dnd/draggable-wrapper'
import { DroppableWrapper } from '@/components/vault/dnd/droppable-wrapper'
import { FolderPicker } from './picker'
import { cn } from '@/lib/utils'

interface FolderCardProps {
  folder: FolderWithProjects
  showProjectCount?: boolean
  parentFolderId?: string | null
  isDragAndDropEnabled?: boolean
  isCompact?: boolean
}

export function FolderCard({ 
  folder, 
  showProjectCount = true, 
  parentFolderId = null,
  isDragAndDropEnabled = false,
  isCompact = false
}: FolderCardProps) {
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null)
  const [newName, setNewName] = useState(folder.name)

  const [, deleteAction, isDeleting] = useDeleteFolderAction({
    onSuccess: () => {
      setShowDeleteDialog(false)
    }
  })

  const [, renameAction, isRenaming] = useRenameFolderAction({
    onSuccess: () => {
      setShowRenameDialog(false)
      setNewName(folder.name)
    }
  })

  const [, moveAction, isMoving] = useMoveFolderAction({
    onSuccess: () => {
      setShowMoveDialog(false)
      setSelectedDestinationId(null)
    }
  })

  const handleRename = async (formData: FormData) => {
    formData.append('folderId', folder.id)
    renameAction(formData)
  }

  const handleDelete = async (formData: FormData) => {
    formData.append('folderId', folder.id)
    deleteAction(formData)
  }

  const handleMove = async (formData: FormData) => {
    formData.append('folderId', folder.id)
    formData.append('parentFolderId', selectedDestinationId || '')
    formData.append('sourceParentFolderId', parentFolderId || '')
    moveAction(formData)
  }

  // State management is now handled by the custom hooks automatically

  // Calculate folder contents description
  const getContentDescription = () => {
    const subFolderCount = (folder as FolderWithProjects & { subFolderCount?: number }).subFolderCount || 0
    const projectCount = showProjectCount ? (folder.projects?.length || 0) : ((folder as FolderWithProjects & { projectCount?: number }).projectCount || 0)
    
    // A folder is only "empty" if it has no subfolders AND no projects
    if (subFolderCount === 0 && projectCount === 0) {
      return 'Empty'
    }
    
    // Build description based on what's actually in the folder
    const parts = []
    if (subFolderCount > 0) {
      parts.push(`${subFolderCount} ${subFolderCount === 1 ? 'folder' : 'folders'}`)
    }
    if (projectCount > 0) {
      parts.push(`${projectCount} ${projectCount === 1 ? 'project' : 'projects'}`)
    }
    
    return parts.join(', ')
  }

  const cardContent = (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Link href={`/vault/folders/${folder.id}`} className="block">
          <Card className="group hover:bg-accent/50 transition-colors cursor-pointer overflow-hidden">
            <AspectRatio ratio={1}>
              <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-2">
                <div className="grid grid-cols-2 gap-1 h-full">
                  {folder.projects?.slice(0, 4).map((project) => (
                    <div key={project.id} className="rounded overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {project.image ? (
                        <img 
                          src={project.image} 
                          alt={project.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 dark:bg-slate-700" />
                      )}
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - (folder.projects?.length || 0)) }).map((_, index) => (
                    <div key={`empty-${index}`} className="rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      {index === 0 && (folder.projects?.length || 0) === 0 && (
                        <Folder className={cn(
                          "text-blue-600 dark:text-blue-400",
                          isCompact ? "h-4 w-4" : "h-6 w-6"
                        )} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </AspectRatio>
            <div className={cn(
              "p-2 space-y-1",
              isCompact && "p-1.5 space-y-0.5"
            )}>
              <h3 className={cn(
                "font-medium truncate",
                isCompact ? "text-xs" : "text-sm"
              )}>
                {folder.name}
              </h3>
              <p className={cn(
                "text-muted-foreground truncate",
                isCompact ? "text-[10px]" : "text-xs"
              )}>
                {getContentDescription()}
              </p>
            </div>
          </Card>
        </Link>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48">
        <ContextMenuItem
          onClick={(e) => {
            e.preventDefault()
            setNewName(folder.name)
            setShowRenameDialog(true)
          }}
        >
          <Edit2 className="h-4 w-4" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem
          onClick={(e) => {
            e.preventDefault()
            setSelectedDestinationId(null)
            setShowMoveDialog(true)
          }}
        >
          <FolderOpen className="h-4 w-4" />
          Move to Folder
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          onClick={(e) => {
            e.preventDefault()
            setShowDeleteDialog(true)
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )

  const dragData = {
    type: 'folder' as const,
    id: folder.id,
    name: folder.name,
    sourceContainer: parentFolderId || 'vault',
  }

  const dropData = {
    type: 'folder' as const,
    id: folder.id,
  }

  return (
    <>
      {isDragAndDropEnabled ? (
        <DroppableWrapper id={`folder-${folder.id}`} data={dropData}>
          <DraggableWrapper id={`folder-${folder.id}`} data={dragData}>
            {cardContent}
          </DraggableWrapper>
        </DroppableWrapper>
      ) : (
        cardContent
      )}

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <form action={handleRename}>
            <DialogHeader>
              <DialogTitle>Rename Folder</DialogTitle>
              <DialogDescription>
                Enter a new name for this folder.
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
                disabled={isRenaming}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isRenaming || !newName.trim()}>
                {isRenaming ? 'Renaming...' : 'Rename'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <form action={handleDelete}>
            <DialogHeader>
              <DialogTitle>Delete Folder</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{folder.name}&quot;? This will also delete all projects and tracks inside it. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="destructive" 
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <form action={handleMove}>
            <DialogHeader>
              <DialogTitle>Move Folder</DialogTitle>
              <DialogDescription>
                Choose where to move &quot;{folder.name}&quot;.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <FolderPicker
                selectedFolderId={selectedDestinationId}
                onFolderSelect={setSelectedDestinationId}
                excludeFolderId={folder.id}
                allowVaultSelection={true}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMoveDialog(false)}
                disabled={isMoving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isMoving}>
                {isMoving ? 'Moving...' : 'Move'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
} 