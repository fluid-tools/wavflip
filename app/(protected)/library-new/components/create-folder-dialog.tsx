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

export function CreateFolderDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [actionKey, setActionKey] = useState(0)
  
  const [state, formAction, isPending] = useActionState(
    createFolderAction, 
    { success: false, error: null } as ActionState,
    `folder-${actionKey}` // Key to reset state
  )

  useEffect(() => {
    if (state.success) {
      toast.success('Folder created successfully')
      setOpen(false)
      setName('')
    }
  }, [state.success])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      setActionKey(prev => prev + 1)
    }
  }

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state.error])



  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Folder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your projects.
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
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? 'Creating...' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 