'use client';

import { useAtomValue } from 'jotai';
import { Edit2, Folder, FolderOpen, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  useDeleteFolderAction,
  useMoveFolderAction,
  useRenameFolderAction,
} from '@/actions/vault/hooks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DraggableWrapper, DroppableWrapper } from '@/components/vault/dnd';
import { FolderPreviewImage } from '@/components/vault/folder-preview-image';
import { useContextMenuHandler } from '@/hooks/use-context-menu-handler';
import { useIsTablet } from '@/hooks/use-mobile';
import type { FolderWithProjects } from '@/lib/contracts/folder';
import { cn } from '@/lib/utils';
import { isSelectModeActiveAtom } from '@/state/vault-selection-atoms';
import { FolderPicker } from './picker';

interface FolderCardProps {
  folder: FolderWithProjects;
  showProjectCount?: boolean;
  parentFolderId?: string | null;
  isDragAndDropEnabled?: boolean;
  isSelected?: boolean;
  onSelectionClick?: (event: React.MouseEvent) => void;
}

export function FolderCard({
  folder,
  showProjectCount = true,
  parentFolderId = null,
  isDragAndDropEnabled = false,
  isSelected = false,
  onSelectionClick,
}: FolderCardProps) {
  const isTablet = useIsTablet();
  // const [isCompact] = useAtom(vaultViewCompactAtom) // TODO: Use for compact styling
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [selectedDestinationId, setSelectedDestinationId] = useState<
    string | null
  >(null);
  const [newName, setNewName] = useState(folder.name);

  const isSelectModeActive = useAtomValue(isSelectModeActiveAtom);
  const { shouldShowContextMenu } = useContextMenuHandler();

  const { execute: deleteExecute, isPending: isDeleting } = useDeleteFolderAction();
  const { execute: renameExecute, isPending: isRenaming } = useRenameFolderAction();
  const { execute: moveExecute, isPending: isMoving } = useMoveFolderAction();

  const handleRename = async (formData: FormData) => {
    const name = formData.get('name') as string;
    if (name?.trim()) {
      await renameExecute({
        folderId: folder.id,
        name: name.trim(),
      });
      setShowRenameDialog(false);
      setNewName(folder.name);
    }
  };

  const handleDelete = async (formData: FormData) => {
    await deleteExecute({
      folderId: folder.id,
    });
    setShowDeleteDialog(false);
  };

  const handleMove = async (formData: FormData) => {
    await moveExecute({
      folderId: folder.id,
      parentFolderId: selectedDestinationId,
      sourceParentFolderId: parentFolderId,
    });
    setShowMoveDialog(false);
    setSelectedDestinationId(null);
  };

  // State management is now handled by the custom hooks automatically

  // Calculate folder contents description
  const getContentDescription = () => {
    const subFolderCount =
      (folder as FolderWithProjects & { subFolderCount?: number })
        .subFolderCount || 0;
    const projectCount = showProjectCount
      ? folder.projects?.length || 0
      : (folder as FolderWithProjects & { projectCount?: number })
          .projectCount || 0;

    // A folder is only "empty" if it has no subfolders AND no projects
    if (subFolderCount === 0 && projectCount === 0) {
      return 'Empty';
    }

    // Build description based on what's actually in the folder
    const parts = [];
    if (subFolderCount > 0) {
      parts.push(
        `${subFolderCount} ${subFolderCount === 1 ? 'folder' : 'folders'}`
      );
    }
    if (projectCount > 0) {
      parts.push(
        `${projectCount} ${projectCount === 1 ? 'project' : 'projects'}`
      );
    }

    return parts.join(', ');
  };

  const cardContent = shouldShowContextMenu() ? (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="block">
          <Card
            className={cn(
              'group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-lg border bg-background p-0 transition-all',
              isTablet ? 'w-40' : 'w-full max-w-40',
              isSelected
                ? 'border-primary ring-2 ring-primary'
                : 'border-muted hover:border-muted-foreground/20'
            )}
            onClick={onSelectionClick}
          >
            {/* Image/Preview Section - No padding */}
            <div className="relative h-40 w-full overflow-hidden">
              <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5 transition-transform duration-300 ease-out group-hover:scale-105">
                {/* 
                  Grid Logic:
                  1. If folder has projects: Show up to 4 project previews
                     - Project with image: Show the image
                     - Project without image: Show project initial in a colored circle
                  2. If folder has no projects: Show folder icon in first cell
                  3. Fill remaining cells with empty placeholders
                */}
                {folder.projects && folder.projects.length > 0 ? (
                  <>
                    {/* Render project previews (up to 4) */}
                    {folder.projects.slice(0, 4).map((project) => (
                      <div
                        className="relative h-full w-full overflow-hidden rounded-sm bg-muted"
                        key={project.id}
                      >
                        <FolderPreviewImage
                          imageKey={project.image}
                          projectId={project.id}
                          projectName={project.name}
                        />
                      </div>
                    ))}
                    {/* Fill remaining cells with empty placeholders */}
                    {Array.from({
                      length: Math.max(0, 4 - folder.projects.length),
                    }).map((_, idx) => (
                      <div
                        className="h-full w-full rounded-sm bg-muted/50"
                        key={`empty-${idx}`}
                      />
                    ))}
                  </>
                ) : (
                  <>
                    {/* No projects: show folder icon in first cell, rest empty */}
                    <div className="flex h-full w-full items-center justify-center rounded-sm bg-muted">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {/* Fill remaining 3 cells with empty placeholders */}
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div
                        className="h-full w-full rounded-sm bg-muted/50"
                        key={`empty-${idx}`}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Metadata Section - No top padding */}
            <div className="px-2 pb-2">
              <h3 className="truncate font-medium text-xs">{folder.name}</h3>
              <p className="truncate text-[10px] text-muted-foreground">
                {getContentDescription()}
              </p>
            </div>

            {/* Invisible overlay for navigation */}
            {!isSelectModeActive && (
              <Link
                className="absolute inset-0 z-10"
                href={`/vault/folders/${folder.id}`}
              />
            )}
          </Card>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48">
        <ContextMenuItem
          onClick={(e) => {
            e.preventDefault();
            setNewName(folder.name);
            setShowRenameDialog(true);
          }}
        >
          <Edit2 className="h-4 w-4" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem
          onClick={(e) => {
            e.preventDefault();
            setSelectedDestinationId(null);
            setShowMoveDialog(true);
          }}
        >
          <FolderOpen className="h-4 w-4" />
          Move to Folder
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={(e) => {
            e.preventDefault();
            setShowDeleteDialog(true);
          }}
          variant="destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ) : (
    <div className="block">
      <Card
        className={cn(
          'group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-lg border bg-background p-0 transition-all',
          isTablet ? 'w-40' : 'w-full max-w-40',
          isSelected
            ? 'border-primary ring-2 ring-primary'
            : 'border-muted hover:border-muted-foreground/20'
        )}
        onClick={onSelectionClick}
      >
        {/* Image/Preview Section - No padding */}
        <div className="relative h-40 w-full overflow-hidden">
          <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5 transition-transform duration-300 ease-out group-hover:scale-105">
            {folder.projects && folder.projects.length > 0 ? (
              <>
                {folder.projects.slice(0, 4).map((project) => (
                  <div
                    className="relative h-full w-full overflow-hidden rounded-sm bg-muted"
                    key={project.id}
                  >
                    <FolderPreviewImage
                      imageKey={project.image}
                      projectId={project.id}
                      projectName={project.name}
                    />
                  </div>
                ))}
                {Array.from({
                  length: Math.max(0, 4 - folder.projects.length),
                }).map((_, idx) => (
                  <div
                    className="h-full w-full rounded-sm bg-muted/50"
                    key={`empty-${idx}`}
                  />
                ))}
              </>
            ) : (
              <>
                <div className="flex h-full w-full items-center justify-center rounded-sm bg-muted">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                </div>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    className="h-full w-full rounded-sm bg-muted/50"
                    key={`empty-${idx}`}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Metadata Section - No top padding */}
        <div className="px-2 pb-2">
          <h3 className="truncate font-medium text-xs">{folder.name}</h3>
          <p className="truncate text-[10px] text-muted-foreground">
            {getContentDescription()}
          </p>
        </div>

        {!isSelectModeActive && (
          <Link
            className="absolute inset-0 z-10"
            href={`/vault/folders/${folder.id}`}
          />
        )}
      </Card>
    </div>
  );

  const dragData = {
    type: 'folder' as const,
    id: folder.id,
    name: folder.name,
    sourceContainer: parentFolderId || 'vault',
  };

  const dropData = {
    type: 'folder' as const,
    id: folder.id,
  };

  return (
    <>
      {isDragAndDropEnabled ? (
        <DroppableWrapper data={dropData} id={`folder-${folder.id}`}>
          <DraggableWrapper data={dragData} id={`folder-${folder.id}`}>
            {cardContent}
          </DraggableWrapper>
        </DroppableWrapper>
      ) : (
        cardContent
      )}

      {/* Rename Dialog */}
      <Dialog onOpenChange={setShowRenameDialog} open={showRenameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <form action={handleRename}>
            <DialogHeader>
              <DialogTitle>Rename Folder</DialogTitle>
              <DialogDescription>
                Enter a new name for this folder.
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
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  value={newName}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={isRenaming}
                onClick={() => setShowRenameDialog(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isRenaming || !newName.trim()} type="submit">
                {isRenaming ? 'Renaming...' : 'Rename'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <form action={handleDelete}>
            <DialogHeader>
              <DialogTitle>Delete Folder</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{folder.name}&quot;? This
                will also delete all projects and tracks inside it. This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                disabled={isDeleting}
                onClick={() => setShowDeleteDialog(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isDeleting} type="submit" variant="destructive">
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog onOpenChange={setShowMoveDialog} open={showMoveDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <form action={handleMove}>
            <DialogHeader>
              <DialogTitle>Move Folder</DialogTitle>
              <DialogDescription>
                Choose where to move &quot;{folder.name}&quot;.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <FolderPicker
                allowVaultSelection={true}
                excludeFolderId={folder.id}
                onFolderSelect={setSelectedDestinationId}
                selectedFolderId={selectedDestinationId}
              />
            </div>
            <DialogFooter>
              <Button
                disabled={isMoving}
                onClick={() => setShowMoveDialog(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isMoving} type="submit">
                {isMoving ? 'Moving...' : 'Move'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
