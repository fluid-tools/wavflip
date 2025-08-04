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
import { FolderPicker } from '@/components/vault/folders/picker'

interface MoveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName: string
  itemType: 'folder' | 'project'
  currentFolderId?: string | null
  excludeFolderId?: string // For folders, exclude self from picker
  onSubmit: (destinationFolderId: string | null) => void
  isLoading?: boolean
}

export function MoveDialog({
  open,
  onOpenChange,
  itemName,
  itemType,
  currentFolderId = null,
  excludeFolderId,
  onSubmit,
  isLoading = false
}: MoveDialogProps) {
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(currentFolderId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(selectedDestinationId)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setSelectedDestinationId(currentFolderId) // Reset to current folder when opening
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Move {itemType === 'folder' ? 'Folder' : 'Project'}</DialogTitle>
            <DialogDescription>
              Choose where to move "{itemName}".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <FolderPicker
              selectedFolderId={selectedDestinationId}
              onFolderSelect={setSelectedDestinationId}
              excludeFolderId={excludeFolderId}
              allowVaultSelection={true}
            />
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Moving...' : 'Move'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}