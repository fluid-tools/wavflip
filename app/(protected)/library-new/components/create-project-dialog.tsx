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
import { createProjectAction } from '../actions'
import { toast } from 'sonner'
import type { Project } from '@/db/schema/library'

interface CreateProjectDialogProps {
  folderId?: string | null
  triggerText?: string
}

type ActionState = {
  success: boolean
  error: string | null
  project?: Project
}

export function CreateProjectDialog({ folderId = null, triggerText = "New Project" }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  
  const [state, formAction, isPending] = useActionState(
    createProjectAction, 
    { success: false, error: null } as ActionState
  )

  useEffect(() => {
    if (state.success && open) {
      toast.success('Project created successfully')
      setOpen(false)
      setName('')
    }
    
    if (state.error) {
      toast.error(state.error)
    }
  }, [state.success, state.error, open])

  const handleSubmit = async (formData: FormData) => {
    if (folderId) {
      formData.append('folderId', folderId)
    }
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
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 