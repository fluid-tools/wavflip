'use client'

import { useState } from 'react'
import { Folder, Edit2, Trash2, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { useAtomValue } from 'jotai'
import { isSelectModeActiveAtom } from '@/state/vault-selection-atoms'
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
import { useDeleteFolderAction, useRenameFolderAction, useMoveFolderAction } from '@/actions/use-vault-action'
import type { FolderWithProjects } from '@/db/schema/vault'

import { DraggableWrapper } from '@/components/vault/dnd/draggable-wrapper'
import { DroppableWrapper } from '@/components/vault/dnd/droppable-wrapper'
import { FolderPicker } from './picker'
import Image from 'next/image'

interface FolderCardProps {
  folder: FolderWithProjects
  showProjectCount?: boolean
  parentFolderId?: string | null
  isDragAndDropEnabled?: boolean
  isSelected?: boolean
  onSelectionClick?: (event: React.MouseEvent) => void
}

export function FolderCard({ 
  folder, 
  showProjectCount = true, 
  parentFolderId = null,
  isDragAndDropEnabled = false,
  isSelected = false,
  onSelectionClick
}: FolderCardProps) {
  // const [isCompact] = useAtom(vaultViewCompactAtom) // TODO: Use for compact styling
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null)
  const [newName, setNewName] = useState(folder.name)
  
  const isSelectModeActive = useAtomValue(isSelectModeActiveAtom)
  const { shouldShowContextMenu } = useContextMenuHandler()

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

  const cardContent = shouldShowContextMenu() ? (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="block">
          <Card 
            className={`w-40 rounded-lg overflow-hidden bg-background border p-2 transition-all cursor-pointer relative ${
              isSelected ? 'ring-2 ring-primary border-primary' : 'border-muted hover:border-muted-foreground/20'
            }`}
            onClick={onSelectionClick}
          >
            <div className="relative w-full aspect-square">
              <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-full h-full">
                {/* 
                  Grid Logic:
                  1. If folder has projects: Show up to 4 project previews
                     - Project with image: Show the image
                     - Project without image: Show project initial in a colored circle
                  2. If folder has no projects: Show folder icon in first cell
                  3. Fill remaining cells with empty placeholders
                */}
                {folder.projects && folder.projects.length > 0 ? (
                  <>
                    {/* Render project previews (up to 4) */}
                    {folder.projects.slice(0, 4).map((project) => (
                      <div key={project.id} className="relative w-full h-full rounded-sm overflow-hidden bg-muted">
                        {project.image ? (
                          // Project has image: show the image
                          <Image
                            src={project.image}
                            alt={project.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                            unoptimized
                          />
                        ) : (
                          // Project has no image: show initial in colored circle
                          <div className="w-full h-full bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 flex items-center justify-center">
                            <span className="text-green-600 dark:text-green-400 font-semibold text-xs">
                              {project.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    {/* Fill remaining cells with empty placeholders */}
                    {Array.from({ length: Math.max(0, 4 - folder.projects.length) }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="w-full h-full rounded-sm bg-muted/50" />
                    ))}
                  </>
                ) : (
                  <>
                    {/* No projects: show folder icon in first cell, rest empty */}
                    <div className="w-full h-full rounded-sm bg-muted flex items-center justify-center">
                      <Folder className="text-muted-foreground h-4 w-4" />
                    </div>
                    {/* Fill remaining 3 cells with empty placeholders */}
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="w-full h-full rounded-sm bg-muted/50" />
                    ))}
                  </>
                )}
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-xs font-medium truncate">{folder.name}</h3>
              <p className="text-[10px] text-muted-foreground truncate">{getContentDescription()}</p>
            </div>
            
            {/* Invisible overlay for navigation */}
            {!isSelectModeActive && (
              <Link 
                href={`/vault/folders/${folder.id}`}
                className="absolute inset-0 z-10"
              />
            )}
          </Card>
        </div>
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
  ) : (
    <div className="block">
      <Card 
        className={`w-40 rounded-lg overflow-hidden bg-background border p-2 transition-all cursor-pointer relative ${
          isSelected ? 'ring-2 ring-primary border-primary' : 'border-muted hover:border-muted-foreground/20'
        }`}
        onClick={onSelectionClick}
      >
        <div className="relative w-full aspect-square">
          <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-full h-full">
            {folder.projects && folder.projects.length > 0 ? (
              <>
                {folder.projects.slice(0, 4).map((project) => (
                  <div key={project.id} className="relative w-full h-full rounded-sm overflow-hidden bg-muted">
                    {project.image ? (
                      <Image
                        src={project.image}
                        alt={project.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 flex items-center justify-center">
                        <span className="text-green-600 dark:text-green-400 font-semibold text-xs">
                          {project.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 4 - folder.projects.length) }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="w-full h-full rounded-sm bg-muted/50" />
                ))}
              </>
            ) : (
              <>
                <div className="w-full h-full rounded-sm bg-muted flex items-center justify-center">
                  <Folder className="text-muted-foreground h-4 w-4" />
                </div>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="w-full h-full rounded-sm bg-muted/50" />
                ))}
              </>
            )}
          </div>
        </div>
        <div className="mt-2">
          <h3 className="text-xs font-medium truncate">{folder.name}</h3>
          <p className="text-[10px] text-muted-foreground truncate">{getContentDescription()}</p>
        </div>
        
        {!isSelectModeActive && (
          <Link 
            href={`/vault/folders/${folder.id}`}
            className="absolute inset-0 z-10"
          />
        )}
      </Card>
    </div>
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