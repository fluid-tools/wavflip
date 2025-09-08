'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type DeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemType: 'folder' | 'project' | 'track';
  onConfirm: () => void;
  isLoading?: boolean;
};

export function DeleteDialog({
  open,
  onOpenChange,
  itemName,
  itemType,
  onConfirm,
  isLoading = false,
}: DeleteDialogProps) {
  const getDescription = () => {
    switch (itemType) {
      case 'folder':
        return `Are you sure you want to delete "${itemName}"? This will also delete all projects and tracks inside it. This action cannot be undone.`;
      case 'project':
        return `Are you sure you want to delete "${itemName}"? This will also delete all tracks and versions inside it. This action cannot be undone.`;
      case 'track':
        return `Are you sure you want to delete "${itemName}"? This action cannot be undone.`;
      default:
        return `Are you sure you want to delete "${itemName}"? This action cannot be undone.`;
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Delete{' '}
            {itemType === 'folder'
              ? 'Folder'
              : itemType === 'project'
                ? 'Project'
                : 'Track'}
          </DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={isLoading}
            onClick={onConfirm}
            type="button"
            variant="destructive"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
