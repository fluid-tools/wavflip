'use client'

import { useState } from 'react'
import { Music, Edit2, Trash2, FolderOpen } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { useActionState } from 'react'
import { deleteProjectAction, renameProjectAction, moveProjectAction } from '@/actions/library'
import { toast } from 'sonner'
import type { Project, ProjectWithTrackCount, FolderWithProjects } from '@/db/schema/library'
import Link from 'next/link'
import { DraggableWrapper } from '../draggable-wrapper'
import { DroppableWrapper } from '../droppable-wrapper'
import { FolderPicker } from '../folder-picker'

interface ProjectCardProps {
  project: Project | ProjectWithTrackCount
  folderId?: string | null
  trackCount?: number
  allFolders?: FolderWithProjects[]
  isDragAndDropEnabled?: boolean
}

export function ProjectCard({ 
  project, 
  folderId, 
  trackCount, 
  allFolders = [], 
  isDragAndDropEnabled = false 
}: ProjectCardProps) {
  // Use trackCount from props if provided, otherwise try to get from project if it has trackCount
  const displayTrackCount = trackCount ?? ('trackCount' in project ? project.trackCount : 0)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(folderId ?? null)
  const [newName, setNewName] = useState(project.name)

  const [deleteState, deleteAction, isDeleting] = useActionState(deleteProjectAction, {
    success: false,
    error: null,
  })

  const [renameState, renameAction, isRenaming] = useActionState(renameProjectAction, {
    success: false,
    error: null,
  })

  const [moveState, moveAction, isMoving] = useActionState(moveProjectAction, {
    success: false,
    error: null,
  })

  const handleRename = async (formData: FormData) => {
    formData.append('projectId', project.id)
    if (folderId) {
      formData.append('folderId', folderId)
    }
    renameAction(formData)
  }

  const handleDelete = async (formData: FormData) => {
    formData.append('projectId', project.id)
    if (folderId) {
      formData.append('folderId', folderId)
    }
    deleteAction(formData)
  }

  const handleMove = async (formData: FormData) => {
    formData.append('projectId', project.id)
    formData.append('folderId', selectedDestinationId || '')
    formData.append('sourceFolderId', folderId || '')
    moveAction(formData)
  }

  // Handle success/error states
  if (renameState.success && showRenameDialog) {
    toast.success('Project renamed successfully')
    setShowRenameDialog(false)
    setNewName(project.name)
  }

  if (renameState.error) {
    toast.error(renameState.error)
  }

  if (deleteState.success && showDeleteDialog) {
    toast.success('Project deleted successfully')
    setShowDeleteDialog(false)
  }

  if (deleteState.error) {
    toast.error(deleteState.error)
  }

  if (moveState.success && showMoveDialog) {
    toast.success('Project moved successfully')
    setShowMoveDialog(false)
    setSelectedDestinationId(folderId ?? null)
  }

  if (moveState.error) {
    toast.error(moveState.error)
  }

  const cardContent = (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Link href={`/library/projects/${project.id}`} className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Music className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm truncate">{project.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {displayTrackCount} {displayTrackCount === 1 ? 'track' : 'tracks'}
                  </CardDescription>
                </div>
                {project.accessType !== 'private' && (
                  <Badge variant="secondary" className="text-xs">
                    {project.accessType}
                  </Badge>
                )}
              </div>
            </CardHeader>
          </Card>
        </Link>
      </ContextMenuTrigger>

        <ContextMenuContent className="w-48">
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

  return (
    <>
      {isDragAndDropEnabled ? (
        <DraggableWrapper id={`project-${project.id}`} data={dragData}>
          {cardContent}
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
                folders={allFolders}
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