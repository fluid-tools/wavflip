'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName: string
  itemType: 'folder' | 'project' | 'track'
  onConfirm: () => void
  isLoading?: boolean
}

export function DeleteDialog({
  open,
  onOpenChange,
  itemName,
  itemType,
  onConfirm,
  isLoading = false
}: DeleteDialogProps) {
  const getDescription = () => {
    switch (itemType) {
      case 'folder':
        return `Are you sure you want to delete "${itemName}"? This will also delete all projects and tracks inside it. This action cannot be undone.`
      case 'project':
        return `Are you sure you want to delete "${itemName}"? This will also delete all tracks and versions inside it. This action cannot be undone.`
      case 'track':
        return `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
      default:
        return `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete {itemType === 'folder' ? 'Folder' : itemType === 'project' ? 'Project' : 'Track'}</DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            variant="destructive" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}