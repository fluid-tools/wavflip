'use client'

import { useState } from 'react'
import { Folder, Edit2, Trash2 } from 'lucide-react'
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
import { useActionState } from 'react'
import { deleteFolderAction, renameFolderAction } from '../actions'
import { toast } from 'sonner'
import type { FolderWithProjects } from '@/db/schema/library'
import Link from 'next/link'

interface FolderCardProps {
  folder: FolderWithProjects
  showProjectCount?: boolean
}

export function FolderCard({ folder, showProjectCount = true }: FolderCardProps) {
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newName, setNewName] = useState(folder.name)

  const [deleteState, deleteAction, isDeleting] = useActionState(deleteFolderAction, {
    success: false,
    error: null,
  })

  const [renameState, renameAction, isRenaming] = useActionState(renameFolderAction, {
    success: false,
    error: null,
  })

  const handleRename = async (formData: FormData) => {
    formData.append('folderId', folder.id)
    renameAction(formData)
  }

  const handleDelete = async (formData: FormData) => {
    formData.append('folderId', folder.id)
    deleteAction(formData)
  }

  // Handle success/error states
  if (renameState.success && showRenameDialog) {
    toast.success('Folder renamed successfully')
    setShowRenameDialog(false)
    setNewName(folder.name)
  }

  if (renameState.error) {
    toast.error(renameState.error)
  }

  if (deleteState.success && showDeleteDialog) {
    toast.success('Folder deleted successfully')
    setShowDeleteDialog(false)
  }

  if (deleteState.error) {
    toast.error(deleteState.error)
  }

  // Calculate folder contents description
  const getContentDescription = () => {
    const subFolderCount = (folder as FolderWithProjects & { subFolderCount?: number }).subFolderCount || 0
    const projectCount = showProjectCount ? (folder.projects?.length || 0) : ((folder as FolderWithProjects & { projectCount?: number }).projectCount || 0)
    
    // If folder has subfolders, show combined count regardless of showProjectCount
    if (subFolderCount > 0) {
      if (projectCount === 0) return `${subFolderCount} ${subFolderCount === 1 ? 'folder' : 'folders'}`
      return `${subFolderCount} ${subFolderCount === 1 ? 'folder' : 'folders'}, ${projectCount} ${projectCount === 1 ? 'project' : 'projects'}`
    }
    
    // If no subfolders, show project count or empty state
    if (projectCount === 0) return showProjectCount ? '0 projects' : 'Empty'
    return `${projectCount} ${projectCount === 1 ? 'project' : 'projects'}`
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Link href={`/library-new/folders/${folder.id}`} className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Folder className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm truncate">{folder.name}</CardTitle>
                    <CardDescription className="text-xs">
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
    </>
  )
} 