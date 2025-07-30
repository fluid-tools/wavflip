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
import { useCreateProjectAction } from '@/actions/use-vault-action'

interface CreateProjectDialogProps {
  folderId?: string | null
  triggerText?: string
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}



export function CreateProjectDialog({ 
  folderId = null, 
  triggerText = "New Project", 
  onSuccess,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: CreateProjectDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [name, setName] = useState('')
  
  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen
  
  const [, formAction] = useCreateProjectAction({
    onSuccess: () => {
      setOpen(false)
      setName('')
      onSuccess?.()
    }
  })


  const handleSubmit = async (formData: FormData) => {
    if (folderId) {
      formData.append('folderId', folderId)
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
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project to organize your tracks.
              {folderId && " This project will be created in the current folder."}
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
                placeholder="Project name"
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
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 