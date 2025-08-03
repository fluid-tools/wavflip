'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateFolderAction, useMoveFolderAction, useMoveProjectAction } from '@/actions/use-vault-action'

interface CreateFolderDialogProps {
  parentFolderId?: string | null
  triggerText?: string
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  selectedItems?: Array<{ id: string; type: 'folder' | 'project' }>
}

export function CreateFolderDialog({ 
  parentFolderId = null, 
  triggerText = "New Folder", 
  onSuccess,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  selectedItems = []
}: CreateFolderDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [name, setName] = useState('')
  
  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen
  
  const [, moveFolderAction] = useMoveFolderAction()
  const [, moveProjectAction] = useMoveProjectAction()
  
  const [, formAction] = useCreateFolderAction({
    onSuccess: (result) => {
      // Move selected items to the newly created folder
      if (selectedItems.length > 0 && result?.folder?.id) {
        const newFolderId = result.folder.id
        
        // Process items using the proper action hooks (they handle invalidation)
        selectedItems.forEach(item => {
          const formData = new FormData()
          
          if (item.type === 'folder') {
            formData.append('folderId', item.id)
            formData.append('parentFolderId', newFolderId)
            formData.append('sourceParentFolderId', parentFolderId || '')
            moveFolderAction(formData)
          } else {
            formData.append('projectId', item.id)
            formData.append('folderId', newFolderId)
            formData.append('sourceFolderId', parentFolderId || '')
            moveProjectAction(formData)
          }
        })
      }
      
      setOpen(false)
      setName('')
      onSuccess?.()
    }
  })

  const handleSubmit = async (formData: FormData) => {
    if (parentFolderId) {
      formData.append('parentFolderId', parentFolderId)
    }
    formAction(formData)
  }



  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Only show trigger when not controlled (used as standalone) */}
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {triggerText}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your {parentFolderId ? 'content' : 'projects'}.
              {parentFolderId && " This folder will be created inside the current folder."}
              {selectedItems.length > 0 && (
                <span className="block mt-2 text-sm font-medium">
                  {selectedItems.length} selected item{selectedItems.length !== 1 ? 's' : ''} will be moved into this folder.
                </span>
              )}
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="Folder name"
                autoFocus
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create Folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 