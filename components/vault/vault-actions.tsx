'use client';

import { FolderPlus, Music, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateFolderDialog } from './folders/create-dialog';
import { CreateProjectDialog } from './projects/create-dialog';
import { SelectionModeToggle } from './selection-mode-toggle';

type VaultActionsProps = {
  folderId?: string | null;
};

export function VaultActions({ folderId }: VaultActionsProps) {
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <SelectionModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="mr-1 h-4 w-4" />
              New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowCreateFolderDialog(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Create Folder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowCreateProjectDialog(true)}>
              <Music className="mr-2 h-4 w-4" />
              Create Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dialogs */}
      <CreateFolderDialog
        onOpenChange={setShowCreateFolderDialog}
        onSuccess={() => setShowCreateFolderDialog(false)}
        open={showCreateFolderDialog}
        parentFolderId={folderId}
      />
      <CreateProjectDialog
        folderId={folderId}
        onOpenChange={setShowCreateProjectDialog}
        onSuccess={() => setShowCreateProjectDialog(false)}
        open={showCreateProjectDialog}
      />
    </>
  );
}
