'use client'

import { useState } from 'react'
import { Music, Edit2, Trash2, FolderOpen, Upload, Image as ImageIcon } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { cn } from '@/lib/utils'
import { useDeleteProjectAction, useRenameProjectAction, useMoveProjectAction } from '@/actions/use-vault-action'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Project, ProjectWithTracks } from '@/db/schema/vault'
import Link from 'next/link'
import { DraggableWrapper } from '@/components/vault/dnd/draggable-wrapper'
import { DroppableWrapper } from '@/components/vault/dnd/droppable-wrapper'
import { FolderPicker } from '@/components/vault/folders/picker'
import Image from 'next/image'

interface ProjectCardProps {
  project: Project | ProjectWithTracks
  folderId?: string | null
  trackCount?: number
  isDragAndDropEnabled?: boolean
  isCompact?: boolean
}

export function ProjectCard({ 
  project, 
  folderId, 
  trackCount, 
  isDragAndDropEnabled = false,
  isCompact = false
}: ProjectCardProps) {
  // Use trackCount from props if provided, otherwise try to get from project if it has trackCount
  const displayTrackCount = trackCount ?? ('trackCount' in project ? project.trackCount : 0)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null)
  const [newName, setNewName] = useState(project.name)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  
  const queryClient = useQueryClient()

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

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/projects/${project.id}/image`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success('Project image updated successfully')
        // Invalidate queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['project', project.id] })
        queryClient.invalidateQueries({ queryKey: ['vault'] })
        queryClient.invalidateQueries({ queryKey: ['vault-sidebar'] })
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      toast.error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const triggerImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = false
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        await handleImageUpload(file)
      }
    }
    input.click()
  }

  // State management is now handled by the custom hooks automatically

  const cardContent = (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Link href={`/vault/projects/${project.id}`} className="block">
          <Card className="max-w-[160px] w-full rounded-lg overflow-hidden bg-background border border-muted p-2">
            <div className="relative w-full aspect-square">
              {project.image ? (
                <Image
                  src={project.image}
                  alt={project.name}
                  fill
                  className="object-cover"
                  sizes="160px"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Music className="text-muted-foreground h-8 w-8" />
                </div>
              )}
            </div>
            <div className="mt-2">
              <h3 className="text-xs font-medium truncate">{project.name}</h3>
              <p className="text-[10px] text-muted-foreground truncate">{displayTrackCount} tracks</p>
            </div>
          </Card>
        </Link>
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