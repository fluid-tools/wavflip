'use client'

import { useState } from 'react'
import { Folder, Edit2, Trash2, FolderOpen } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
          <Card className="group hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className={isCompact ? "p-2.5" : "p-3"}>
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "rounded-md bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0",
                  isCompact ? "h-6 w-6" : "h-8 w-8"
                )}>
                  <Folder className={cn(
                    "text-blue-600 dark:text-blue-400",
                    isCompact ? "h-3 w-3" : "h-4 w-4"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className={cn(
                    "font-medium truncate",
                    isCompact ? "text-xs" : "text-sm"
                  )}>
                    {folder.name}
                  </CardTitle>
                  <CardDescription className={cn(
                    "truncate",
                    isCompact ? "text-[10px]" : "text-xs"
                  )}>
                    {getContentDescription()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
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