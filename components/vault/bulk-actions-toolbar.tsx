'use client';

import { FolderPlus, Move, Trash2, X } from 'lucide-react';
import { startTransition, useState } from 'react';
import {
  useDeleteFolderAction,
  useDeleteProjectAction,
  useMoveFolderAction,
  useMoveProjectAction,
} from '@/actions/vault/use-action';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreateFolderDialog } from '@/components/vault/folders/create-dialog';
import { FolderPicker } from '@/components/vault/folders/picker';
import { useVaultSelection } from '@/hooks/vault/use-vault-selection';

interface BulkActionsToolbarProps {
  vaultItems: Array<{ id: string; type: 'folder' | 'project'; name: string }>;
  parentFolderId?: string | null;
}

export function BulkActionsToolbar({
  vaultItems,
  parentFolderId = null,
}: BulkActionsToolbarProps) {
  const { selectedItems, selectedCount, clearSelection } = useVaultSelection();
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDestinationId, setSelectedDestinationId] = useState<
    string | null
  >(null);
  const [hasSelectedDestination, setHasSelectedDestination] = useState(false);

  const [, deleteFolderAction] = useDeleteFolderAction({
    onSuccess: () => {
      // Individual success handling if needed
    },
  });
  const [, deleteProjectAction] = useDeleteProjectAction({
    onSuccess: () => {
      // Individual success handling if needed
    },
  });
  const [, moveFolderAction] = useMoveFolderAction({
    onSuccess: () => {
      // Individual success handling if needed
    },
  });
  const [, moveProjectAction] = useMoveProjectAction({
    onSuccess: () => {
      // Individual success handling if needed
    },
  });

  // Only show toolbar when we have selected items
  if (selectedCount === 0) {
    return null;
  }

  const selectedItemsData = vaultItems.filter((item) =>
    selectedItems.includes(item.id)
  );
  const folderCount = selectedItemsData.filter(
    (item) => item.type === 'folder'
  ).length;
  const projectCount = selectedItemsData.filter(
    (item) => item.type === 'project'
  ).length;

  const handleCreateFolderWithSelection = () => {
    setShowCreateFolderDialog(true);
  };

  const handleBulkMove = () => {
    setSelectedDestinationId(null);
    setHasSelectedDestination(false); // Reset selection state
    setShowMoveDialog(true);
  };

  const handleBulkDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmBulkDelete = () => {
    // Process items using the proper action hooks with startTransition
    startTransition(() => {
      selectedItemsData.forEach((item) => {
        const formData = new FormData();

        if (item.type === 'folder') {
          formData.append('folderId', item.id);
          deleteFolderAction(formData);
        } else {
          formData.append('projectId', item.id);
          deleteProjectAction(formData);
        }
      });
    });

    setShowDeleteDialog(false);
    clearSelection();
  };

  const confirmBulkMove = () => {
    // Don't proceed if no destination has been selected yet
    if (!hasSelectedDestination) return;

    // Process items using the proper action hooks with startTransition
    startTransition(() => {
      selectedItemsData.forEach((item) => {
        const formData = new FormData();

        if (item.type === 'folder') {
          formData.append('folderId', item.id);
          formData.append('parentFolderId', selectedDestinationId || ''); // null becomes empty string for root
          formData.append('sourceParentFolderId', parentFolderId || '');
          moveFolderAction(formData);
        } else {
          formData.append('projectId', item.id);
          formData.append('folderId', selectedDestinationId || ''); // null becomes empty string for root
          formData.append('sourceFolderId', parentFolderId || '');
          moveProjectAction(formData);
        }
      });
    });

    setShowMoveDialog(false);
    clearSelection();
  };

  const getSelectionText = () => {
    if (folderCount > 0 && projectCount > 0) {
      return `${folderCount} folder${folderCount !== 1 ? 's' : ''}, ${projectCount} project${projectCount !== 1 ? 's' : ''} selected`;
    }
    if (folderCount > 0) {
      return `${folderCount} folder${folderCount !== 1 ? 's' : ''} selected`;
    }
    return `${projectCount} project${projectCount !== 1 ? 's' : ''} selected`;
  };

  return (
    <>
      <div className="-translate-x-1/2 fixed bottom-6 left-1/2 z-50 transform">
        <Card className="border bg-background p-4 shadow-lg">
          <div className="flex items-center gap-4">
            <span className="font-medium text-sm">{getSelectionText()}</span>

            <div className="flex items-center gap-2">
              <Button
                className="h-8"
                onClick={handleCreateFolderWithSelection}
                size="sm"
                variant="outline"
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Create Folder
              </Button>

              <Button
                className="h-8"
                onClick={handleBulkMove}
                size="sm"
                variant="outline"
              >
                <Move className="mr-2 h-4 w-4" />
                Move to...
              </Button>

              <Button
                className="h-8"
                onClick={handleBulkDelete}
                size="sm"
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>

              <Button
                className="h-8"
                onClick={clearSelection}
                size="sm"
                variant="ghost"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        onOpenChange={setShowCreateFolderDialog}
        onSuccess={() => {
          setShowCreateFolderDialog(false);
          clearSelection();
        }}
        open={showCreateFolderDialog}
        parentFolderId={parentFolderId}
        selectedItems={selectedItemsData}
      />

      {/* Move Dialog */}
      <Dialog onOpenChange={setShowMoveDialog} open={showMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Items</DialogTitle>
            <DialogDescription>
              Select a destination folder for the selected items.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <FolderPicker
              excludeFolderId={
                selectedItemsData
                  .filter((item) => item.type === 'folder')
                  .map((item) => item.id)[0] // Only exclude first folder for now
              }
              onFolderSelect={(folderId) => {
                setSelectedDestinationId(folderId);
                setHasSelectedDestination(true);
              }}
              selectedFolderId={selectedDestinationId}
            />
          </div>

          <DialogFooter>
            <Button onClick={() => setShowMoveDialog(false)} variant="outline">
              Cancel
            </Button>
            <Button
              disabled={!hasSelectedDestination}
              onClick={confirmBulkMove}
            >
              {selectedDestinationId === null ? 'Move to Vault' : 'Move Items'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Items</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the selected items? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              {selectedItemsData.map((item) => (
                <div className="flex items-center gap-2 text-sm" key={item.id}>
                  {item.type === 'folder' ? (
                    <FolderPlus className="h-4 w-4" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowDeleteDialog(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={confirmBulkDelete} variant="destructive">
              Delete Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
