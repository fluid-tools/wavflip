'use client'

import { useState } from 'react'
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

interface RenameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName: string
  itemType: 'folder' | 'project' | 'track'
  onSubmit: (newName: string) => void
  isLoading?: boolean
}

export function RenameDialog({
  open,
  onOpenChange,
  itemName,
  itemType,
  onSubmit,
  isLoading = false
}: RenameDialogProps) {
  const [newName, setNewName] = useState(itemName)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newName.trim()) {
      onSubmit(newName.trim())
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setNewName(itemName) // Reset to original name when opening
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename {itemType === 'folder' ? 'Folder' : itemType === 'project' ? 'Project' : 'Track'}</DialogTitle>
            <DialogDescription>
              Enter a new name for this {itemType}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
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
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !newName.trim()}>
              {isLoading ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}