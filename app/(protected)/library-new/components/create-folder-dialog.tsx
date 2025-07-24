'use client'

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
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
import { createFolderAction } from '../actions'
import { toast } from 'sonner'
import type { Folder } from '@/db/schema/library'

type ActionState = {
  success: boolean
  error: string | null
  folder?: Folder
}

interface CreateFolderDialogProps {
  parentFolderId?: string | null
  triggerText?: string
}

export function CreateFolderDialog({ parentFolderId = null, triggerText = "New Folder" }: CreateFolderDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [state, formAction] = useActionState(
    createFolderAction, 
    { success: false, error: null } as ActionState
  )

  // Handle success/error from action
  useEffect(() => {
    if (state.success && isSubmitting) {
      toast.success('Folder created successfully')
      setOpen(false)
      setName('')
      setIsSubmitting(false)
    }
  }, [state.success, isSubmitting])

  useEffect(() => {
    if (state.error && isSubmitting) {
      toast.error(state.error)
      setIsSubmitting(false)
    }
  }, [state.error, isSubmitting])

  const handleSubmit = async (formData: FormData) => {
    if (parentFolderId) {
      formData.append('parentFolderId', parentFolderId)
    }
    setIsSubmitting(true)
    formAction(formData)
  }



  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your {parentFolderId ? 'content' : 'projects'}.
              {parentFolderId && " This folder will be created inside the current folder."}
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 