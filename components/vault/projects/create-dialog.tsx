'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useCreateProjectAction } from '@/actions/vault/hooks';
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

interface CreateProjectDialogProps {
  folderId?: string | null;
  triggerText?: string;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateProjectDialog({
  folderId = null,
  triggerText = 'New Project',
  onSuccess,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateProjectDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState('');

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const { execute: createProjectExecute } = useCreateProjectAction({
    onSuccess: () => {
      setOpen(false);
      setName('');
      onSuccess?.();
    },
  });

  const handleSubmit = async (formData: FormData) => {
    const name = formData.get('name') as string;
    createProjectExecute({
      name,
      folderId: folderId || null,
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
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project to organize your tracks.
              {folderId &&
                ' This project will be created in the current folder.'}
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
                placeholder="Project name"
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
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
