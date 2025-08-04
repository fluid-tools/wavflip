'use client'

import { useState } from 'react'
import { Music, Edit2, Trash2, FolderOpen, Upload, Image as ImageIcon } from 'lucide-react'
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
import { useDeleteProjectAction, useRenameProjectAction, useMoveProjectAction } from '@/actions/use-vault-action'
import type { Project, ProjectWithTracks } from '@/db/schema/vault'

import { DraggableWrapper } from '@/components/vault/dnd/draggable-wrapper'
import { DroppableWrapper } from '@/components/vault/dnd/droppable-wrapper'
import { FolderPicker } from '@/components/vault/folders/picker'
import Image from 'next/image'
import { useProject } from '@/hooks/data/use-project'

interface ProjectCardProps {
  project: Project | ProjectWithTracks
  folderId?: string | null
  trackCount?: number
  isDragAndDropEnabled?: boolean
  isSelected?: boolean
  onSelectionClick?: (event: React.MouseEvent) => void
}

export function ProjectCard({ 
  project, 
  folderId, 
  trackCount, 
  isDragAndDropEnabled = false,
  isSelected = false,
  onSelectionClick
}: ProjectCardProps) {
  // const [isCompact] = useAtom(vaultViewCompactAtom) // TODO: Use for compact styling
  // Use trackCount from props if provided, otherwise try to get from project if it has trackCount
  const displayTrackCount = trackCount ?? ('trackCount' in project ? project.trackCount : 0)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null)
  const [newName, setNewName] = useState(project.name)
  
  const isSelectModeActive = useAtomValue(isSelectModeActiveAtom)
  const { shouldShowContextMenu } = useContextMenuHandler()
  
  // Use the project hook for image upload functionality
  const { uploadImage, isUploadingImage } = useProject({ projectId: project.id })

  const [, deleteAction, isDeleting] = useDeleteProjectAction({
    onSuccess: () => {
      setShowDeleteDialog(false)
    }
  })

  const [, renameAction, isRenaming] = useRenameProjectAction({
    onSuccess: () => {
      setShowRenameDialog(false)
      setNewName(project.name)
    }
  })

  const [, moveAction, isMoving] = useMoveProjectAction({
    onSuccess: () => {
      setShowMoveDialog(false)
      setSelectedDestinationId(folderId ?? null)
    }
  })

  const handleRename = async (formData: FormData) => {
    formData.append('projectId', project.id)
    renameAction(formData)
  }

  const handleDelete = async (formData: FormData) => {
    formData.append('projectId', project.id)
    deleteAction(formData)
  }

  const handleMove = async (formData: FormData) => {
    formData.append('projectId', project.id)
    formData.append('folderId', selectedDestinationId || '')
    formData.append('sourceFolderId', folderId || '')
    moveAction(formData)
  }

  const triggerImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = false
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        await uploadImage(file)
      }
    }
    input.click()
  }

  // State management is now handled by the custom hooks automatically

  const cardContent = shouldShowContextMenu() ? (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="block">
          <Card 
            className={`w-full max-w-40 aspect-[4/5] rounded-lg overflow-hidden bg-background border transition-all cursor-pointer relative p-0 group ${
              isSelected ? 'ring-2 ring-primary border-primary' : 'border-muted hover:border-muted-foreground/20'
            }`}
            onClick={onSelectionClick}
          >
            {/* Image/Preview Section - No padding */}
            <div className="relative w-full h-40 overflow-hidden">
              {project.image ? (
                <Image
                  src={project.image}
                  alt={project.name}
                  fill
                  className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                  sizes="(max-width: 640px) 160px, (max-width: 768px) 180px, (max-width: 1024px) 200px, 240px"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted transition-transform duration-300 ease-out group-hover:scale-105">
                  <Music className="text-muted-foreground h-8 w-8" />
                </div>
              )}
            </div>
            
            {/* Metadata Section - No top padding */}
            <div className="px-2 pb-2">
              <h3 className="text-xs font-medium truncate">{project.name}</h3>
              <p className="text-[10px] text-muted-foreground truncate">{displayTrackCount} tracks</p>
            </div>
            
            {/* Invisible overlay for navigation */}
            {!isSelectModeActive && (
              <Link 
                href={`/vault/projects/${project.id}`}
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
              triggerImageUpload()
            }}
            disabled={isUploadingImage}
          >
            {isUploadingImage ? (
              <Upload className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
            {isUploadingImage ? 'Uploading...' : 'Upload Image'}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={(e) => {
              e.preventDefault()
              setNewName(project.name)
              setShowRenameDialog(true)
            }}
          >
            <Edit2 className="h-4 w-4" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            onClick={(e) => {
              e.preventDefault()
              setSelectedDestinationId(folderId ?? null)
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
          className={`w-full max-w-40 aspect-[4/5] rounded-lg overflow-hidden bg-background border transition-all cursor-pointer relative p-0 group ${
            isSelected ? 'ring-2 ring-primary border-primary' : 'border-muted hover:border-muted-foreground/20'
          }`}
          onClick={onSelectionClick}
        >
          {/* Image/Preview Section - No padding */}
          <div className="relative w-full h-40 overflow-hidden">
            {project.image ? (
              <Image
                src={project.image}
                alt={project.name}
                fill
                className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                sizes="(max-width: 640px) 160px, (max-width: 768px) 180px, (max-width: 1024px) 200px, 240px"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted transition-transform duration-300 ease-out group-hover:scale-105">
                <Music className="text-muted-foreground h-8 w-8" />
              </div>
            )}
          </div>
          
          {/* Metadata Section - No top padding */}
          <div className="px-2 pb-2">
            <h3 className="text-xs font-medium truncate">{project.name}</h3>
            <p className="text-[10px] text-muted-foreground truncate">{displayTrackCount} tracks</p>
          </div>
          
          {!isSelectModeActive && (
            <Link 
              href={`/vault/projects/${project.id}`}
              className="absolute inset-0 z-10"
            />
          )}
      </Card>
    </div>
  )

  const dragData = {
    type: 'project' as const,
    id: project.id,
    name: project.name,
    sourceContainer: folderId || 'vault',
  }

  const dropData = {
    type: 'project' as const,
    id: project.id,
    name: project.name,
  }

  return (
    <>
      {isDragAndDropEnabled ? (
        <DraggableWrapper id={`project-${project.id}`} data={dragData}>
          <DroppableWrapper id={`project-drop-${project.id}`} data={dropData}>
            {cardContent}
          </DroppableWrapper>
        </DraggableWrapper>
      ) : (
        cardContent
      )}

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <form action={handleRename}>
            <DialogHeader>
              <DialogTitle>Rename Project</DialogTitle>
              <DialogDescription>
                Enter a new name for this project.
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
              <DialogTitle>Delete Project</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{project.name}&quot;? This will also delete all tracks and versions inside it. This action cannot be undone.
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
              <DialogTitle>Move Project</DialogTitle>
              <DialogDescription>
                Choose where to move &quot;{project.name}&quot;.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <FolderPicker
                selectedFolderId={selectedDestinationId}
                onFolderSelect={setSelectedDestinationId}
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