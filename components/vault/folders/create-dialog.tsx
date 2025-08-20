'use client';

import { Plus } from 'lucide-react';
import { startTransition, useState } from 'react';
import {
  useCreateFolderAction,
  useMoveFolderAction,
  useMoveProjectAction,
} from '@/actions/vault/hooks';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateFolderDialogProps {
  parentFolderId?: string | null;
  triggerText?: string;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  selectedItems?: Array<{ id: string; type: 'folder' | 'project' }>;
}

export function CreateFolderDialog({
  parentFolderId = null,
  triggerText = 'New Folder',
  onSuccess,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  selectedItems = [],
}: CreateFolderDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState('');

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const { execute: moveFolderExecute } = useMoveFolderAction();
  const { execute: moveProjectExecute } = useMoveProjectAction();

  const { execute: createFolderExecute } = useCreateFolderAction({
    onSuccess: (result) => {
      // Move selected items to the newly created folder
      if (selectedItems.length > 0 && result?.folder?.id) {
        const newFolderId = result.folder.id;

        // Process items using the proper action hooks with startTransition
        startTransition(() => {
          selectedItems.forEach((item) => {
            if (item.type === 'folder') {
              moveFolderExecute({
                folderId: item.id,
                parentFolderId: newFolderId,
                sourceParentFolderId: parentFolderId || null,
              });
            } else {
              moveProjectExecute({
                projectId: item.id,
                folderId: newFolderId,
                sourceFolderId: parentFolderId || null,
              });
            }
          });
        });
      }

      setOpen(false);
      setName('');
      onSuccess?.();
    },
  });

  const handleSubmit = async (formData: FormData) => {
    const name = formData.get('name') as string;
    createFolderExecute({
      name,
      parentFolderId: parentFolderId || null,
    });
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      {/* Only show trigger when not controlled (used as standalone) */}
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            {triggerText}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your{' '}
              {parentFolderId ? 'content' : 'projects'}.
              {parentFolderId &&
                ' This folder will be created inside the current folder.'}
              {selectedItems.length > 0 && (
                <span className="mt-2 block font-medium text-sm">
                  {selectedItems.length} selected item
                  {selectedItems.length !== 1 ? 's' : ''} will be moved into
                  this folder.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="name">
                Name
              </Label>
              <Input
                autoFocus
                className="col-span-3"
                id="name"
                name="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="Folder name"
                required
                value={name}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={!name.trim()} type="submit">
              Create Folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
