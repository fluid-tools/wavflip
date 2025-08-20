'use client';

import { useAtomValue } from 'jotai';
import {
  Edit2,
  FolderOpen,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  useDeleteProjectAction,
  useMoveProjectAction,
  useRenameProjectAction,
} from '@/actions/vault/use-action';
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
import { FolderPicker } from '@/components/vault/folders/picker';
import { useProject } from '@/hooks/data/use-project';
import { useContextMenuHandler } from '@/hooks/use-context-menu-handler';
import { useIsTablet } from '@/hooks/use-mobile';
import type { Project, ProjectWithTracks } from '@/lib/contracts/project';
import { cn } from '@/lib/utils';
import { isSelectModeActiveAtom } from '@/state/vault-selection-atoms';

interface ProjectCardProps {
  project: Project | ProjectWithTracks;
  folderId?: string | null;
  trackCount?: number;
  isDragAndDropEnabled?: boolean;
  isSelected?: boolean;
  onSelectionClick?: (event: React.MouseEvent) => void;
}

export function ProjectCard({
  project,
  folderId,
  trackCount,
  isDragAndDropEnabled = false,
  isSelected = false,
  onSelectionClick,
}: ProjectCardProps) {
  const isTablet = useIsTablet();
  // const [isCompact] = useAtom(vaultViewCompactAtom) // TODO: Use for compact styling
  // Use trackCount from props if provided, otherwise try to get from project if it has trackCount
  const displayTrackCount =
    trackCount ?? ('trackCount' in project ? project.trackCount : 0);

  // Check if this is the special Generations project
  const isGenerationsProject = project.id === 'system-generations';
  const isSystemProject = Boolean(
    project.metadata &&
      typeof project.metadata === 'object' &&
      'isSystem' in project.metadata &&
      (project.metadata as Record<string, unknown>).isSystem === true
  );
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [selectedDestinationId, setSelectedDestinationId] = useState<
    string | null
  >(null);
  const [newName, setNewName] = useState(project.name);

  const isSelectModeActive = useAtomValue(isSelectModeActiveAtom);
  const { shouldShowContextMenu } = useContextMenuHandler();

  // Use the project hook for image upload functionality
  const { uploadImage, isUploadingImage, presignedImageUrl } = useProject({
    projectId: project.id,
    enabled: false, // avoid fetching the full project on the vault grid
    initialData:
      'tracks' in project
        ? (project as ProjectWithTracks)
        : ({
            ...(project as Project),
            tracks: [],
            trackCount: displayTrackCount,
          } as ProjectWithTracks),
  });

  const [, deleteAction, isDeleting] = useDeleteProjectAction({
    onSuccess: () => {
      setShowDeleteDialog(false);
    },
  });

  const [, renameAction, isRenaming] = useRenameProjectAction({
    onSuccess: () => {
      setShowRenameDialog(false);
      setNewName(project.name);
    },
  });

  const [, moveAction, isMoving] = useMoveProjectAction({
    onSuccess: () => {
      setShowMoveDialog(false);
      setSelectedDestinationId(folderId ?? null);
    },
  });

  const handleRename = async (formData: FormData) => {
    formData.append('projectId', project.id);
    renameAction(formData);
  };

  const handleDelete = async (formData: FormData) => {
    formData.append('projectId', project.id);
    deleteAction(formData);
  };

  const handleMove = async (formData: FormData) => {
    formData.append('projectId', project.id);
    formData.append('folderId', selectedDestinationId || '');
    formData.append('sourceFolderId', folderId || '');
    moveAction(formData);
  };

  const triggerImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await uploadImage(file);
      }
    };
    input.click();
  };

  // Determine what image source to use:
  // 1. If it's a blob URL (optimistic update), use it directly
  // 2. If we have a presigned URL, use that
  // 3. If we have an image key but no presigned URL yet, show nothing (loading state)
  const imageSrc = project.image?.startsWith('blob:')
    ? project.image
    : project.image && presignedImageUrl
      ? presignedImageUrl
      : null;

  // State management is now handled by the custom hooks automatically

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
              {isGenerationsProject ? (
                // Special design for Generations project
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                  <Sparkles className="h-12 w-12 text-white" />
                </div>
              ) : imageSrc ? (
                <Image
                  alt={project.name}
                  className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                  fill
                  priority
                  sizes="(max-width: 640px) 160px, (max-width: 768px) 180px, (max-width: 1024px) 200px, 240px"
                  src={imageSrc}
                />
              ) : project.image && !presignedImageUrl ? (
                // Image exists but presigned URL is loading
                <div className="absolute inset-0 flex animate-pulse items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
                  <span className="font-semibold text-blue-600 text-lg dark:text-blue-400">
                    {project.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              ) : (
                // No image at all
                <div className="absolute inset-0 flex items-center justify-center opacity-40 hover:opacity-100">
                  <ImageIcon className="absolute bottom-1/3 h-6 w-6" />
                </div>
              )}
            </div>

            {/* Metadata Section - No top padding */}
            <div className="px-2 pb-2">
              <h3 className="truncate font-medium text-xs">{project.name}</h3>
              <p className="truncate text-[10px] text-muted-foreground">
                {displayTrackCount} tracks
              </p>
            </div>

            {/* Invisible overlay for navigation */}
            {!isSelectModeActive && (
              <Link
                className="absolute inset-0 z-10"
                href={`/vault/projects/${project.id}`}
              />
            )}
          </Card>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48">
        <ContextMenuItem
          disabled={isUploadingImage || isSystemProject}
          onClick={(e) => {
            e.preventDefault();
            triggerImageUpload();
          }}
        >
          {isUploadingImage ? (
            <Upload className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
          {isUploadingImage ? 'Uploading...' : 'Upload Image'}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          disabled={isSystemProject}
          onClick={(e) => {
            e.preventDefault();
            setNewName(project.name);
            setShowRenameDialog(true);
          }}
        >
          <Edit2 className="h-4 w-4" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem
          disabled={isSystemProject}
          onClick={(e) => {
            e.preventDefault();
            setSelectedDestinationId(folderId ?? null);
            setShowMoveDialog(true);
          }}
        >
          <FolderOpen className="h-4 w-4" />
          Move to Folder
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          disabled={isSystemProject}
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
          {isGenerationsProject ? (
            // Special design for Generations project
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
          ) : imageSrc ? (
            <Image
              alt={project.name}
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
              fill
              priority
              sizes="(max-width: 640px) 160px, (max-width: 768px) 180px, (max-width: 1024px) 200px, 240px"
              src={imageSrc}
            />
          ) : project.image && !presignedImageUrl ? (
            // Image exists but presigned URL is loading
            <div className="absolute inset-0 flex animate-pulse items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
              <span className="font-semibold text-blue-600 text-lg dark:text-blue-400">
                {project.name.charAt(0).toUpperCase()}
              </span>
            </div>
          ) : (
            // No image at all
            <div className="absolute inset-0 flex items-center justify-center opacity-40 hover:opacity-100">
              <ImageIcon className="absolute bottom-1/3 h-6 w-6" />
            </div>
          )}
        </div>

        {/* Metadata Section - No top padding */}
        <div className="px-2 pb-2">
          <h3 className="truncate font-medium text-xs">{project.name}</h3>
          <p className="truncate text-[10px] text-muted-foreground">
            {displayTrackCount} tracks
          </p>
        </div>

        {!isSelectModeActive && (
          <Link
            className="absolute inset-0 z-10"
            href={`/vault/projects/${project.id}`}
          />
        )}
      </Card>
    </div>
  );

  const dragData = {
    type: 'project' as const,
    id: project.id,
    name: project.name,
    sourceContainer: folderId || 'vault',
  };

  const dropData = {
    type: 'project' as const,
    id: project.id,
    name: project.name,
  };

  return (
    <>
      {isDragAndDropEnabled ? (
        <DraggableWrapper data={dragData} id={`project-${project.id}`}>
          <DroppableWrapper data={dropData} id={`project-drop-${project.id}`}>
            {cardContent}
          </DroppableWrapper>
        </DraggableWrapper>
      ) : (
        cardContent
      )}

      {/* Rename Dialog */}
      <Dialog onOpenChange={setShowRenameDialog} open={showRenameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <form action={handleRename}>
            <DialogHeader>
              <DialogTitle>Rename Project</DialogTitle>
              <DialogDescription>
                Enter a new name for this project.
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
              <DialogTitle>Delete Project</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{project.name}&quot;? This
                will also delete all tracks and versions inside it. This action
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
              <DialogTitle>Move Project</DialogTitle>
              <DialogDescription>
                Choose where to move &quot;{project.name}&quot;.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <FolderPicker
                allowVaultSelection={true}
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
