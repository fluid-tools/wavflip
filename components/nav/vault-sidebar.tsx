'use client';

import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Folder,
  FolderOpen,
  FolderPlus,
  Move,
  Music,
  Plus,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { startTransition, useState } from 'react';
import {
  useDeleteFolderAction,
  useDeleteProjectAction,
  useMoveFolderAction,
  useMoveProjectAction,
  useRenameFolderAction,
  useRenameProjectAction,
} from '@/actions/vault/hooks';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { DeleteDialog } from '@/components/vault/dialogs/delete-dialog';
import { MoveDialog } from '@/components/vault/dialogs/move-dialog';
import { RenameDialog } from '@/components/vault/dialogs/rename-dialog';
import { CreateFolderDialog } from '@/components/vault/folders/create-dialog';
import { CreateProjectDialog } from '@/components/vault/projects/create-dialog';
import { useVaultTree } from '@/hooks/data/use-vault';
import { useContextMenuHandler } from '@/hooks/use-context-menu-handler';

interface SidebarFolder {
  id: string;
  name: string;
  parentFolderId: string | null;
  projects: Array<{
    id: string;
    name: string;
    trackCount: number;
  }>;
  subfolders: SidebarFolder[];
  projectCount: number;
  subFolderCount: number;
}

export function VaultSidebarNavigation() {
  const pathname = usePathname();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);

  // Context menu dialogs state
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    name: string;
    type: 'folder' | 'project';
    parentId?: string | null;
  } | null>(null);

  // Use the new vault hooks
  const { data: vaultData, isLoading } = useVaultTree({ levels: false });
  const { shouldShowContextMenu } = useContextMenuHandler();

  // Action hooks
  const { execute: deleteFolderExecute, isPending: isDeletingFolder } = useDeleteFolderAction();
  const { execute: renameFolderExecute, isPending: isRenamingFolder } = useRenameFolderAction();
  const { execute: moveFolderExecute, isPending: isMovingFolder } = useMoveFolderAction();
  const { execute: deleteProjectExecute, isPending: isDeletingProject } = useDeleteProjectAction();
  const { execute: renameProjectExecute, isPending: isRenamingProject } = useRenameProjectAction();
  const { execute: moveProjectExecute, isPending: isMovingProject } = useMoveProjectAction();

  // Context menu handlers
  const handleRename = (item: {
    id: string;
    name: string;
    type: 'folder' | 'project';
    parentId?: string | null;
  }) => {
    setSelectedItem(item);
    setShowRenameDialog(true);
  };

  const handleDelete = (item: {
    id: string;
    name: string;
    type: 'folder' | 'project';
    parentId?: string | null;
  }) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  const handleMove = (item: {
    id: string;
    name: string;
    type: 'folder' | 'project';
    parentId?: string | null;
  }) => {
    setSelectedItem(item);
    setShowMoveDialog(true);
  };

  // Dialog handlers
  const handleRenameSubmit = async (newName: string) => {
    if (!selectedItem) return;

    startTransition(async () => {
      if (selectedItem.type === 'folder') {
        await renameFolderExecute({
          folderId: selectedItem.id,
          name: newName,
        });
      } else {
        await renameProjectExecute({
          projectId: selectedItem.id,
          name: newName,
          folderId: selectedItem.parentId,
        });
      }
      setShowRenameDialog(false);
      setSelectedItem(null);
    });
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;

    startTransition(async () => {
      if (selectedItem.type === 'folder') {
        await deleteFolderExecute({
          folderId: selectedItem.id,
        });
      } else {
        await deleteProjectExecute({
          projectId: selectedItem.id,
          folderId: selectedItem.parentId,
        });
      }
      setShowDeleteDialog(false);
      setSelectedItem(null);
    });
  };

  const handleMoveSubmit = async (destinationFolderId: string | null) => {
    if (!selectedItem) return;

    startTransition(async () => {
      if (selectedItem.type === 'folder') {
        await moveFolderExecute({
          folderId: selectedItem.id,
          parentFolderId: destinationFolderId,
          sourceParentFolderId: selectedItem.parentId,
        });
      } else {
        await moveProjectExecute({
          projectId: selectedItem.id,
          folderId: destinationFolderId,
          sourceFolderId: selectedItem.parentId,
        });
      }
      setShowMoveDialog(false);
      setSelectedItem(null);
    });
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolder = (folder: SidebarFolder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isActive = pathname === `/vault/folders/${folder.id}`;
    const hasSubItems =
      (folder.subfolders && folder.subfolders.length > 0) ||
      folder.projects.length > 0;

    const shouldShowSubItems = hasSubItems;

    const folderContextMenu = shouldShowContextMenu() ? (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <SidebarMenuButton asChild isActive={isActive}>
            <Link href={`/vault/folders/${folder.id}`}>
              <Folder className="h-4 w-4" />
              <span>{folder.name}</span>
            </Link>
          </SidebarMenuButton>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem
            onClick={(e) => {
              e.preventDefault();
              handleRename({
                id: folder.id,
                name: folder.name,
                type: 'folder',
                parentId: folder.parentFolderId,
              });
            }}
          >
            <Edit2 className="h-4 w-4" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            onClick={(e) => {
              e.preventDefault();
              handleMove({
                id: folder.id,
                name: folder.name,
                type: 'folder',
                parentId: folder.parentFolderId,
              });
            }}
          >
            <Move className="h-4 w-4" />
            Move to Folder
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            className="text-destructive"
            onClick={(e) => {
              e.preventDefault();
              handleDelete({
                id: folder.id,
                name: folder.name,
                type: 'folder',
                parentId: folder.parentFolderId,
              });
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ) : (
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={`/vault/folders/${folder.id}`}>
          <Folder className="h-4 w-4" />
          <span>{folder.name}</span>
        </Link>
      </SidebarMenuButton>
    );

    return (
      <div key={folder.id}>
        <SidebarMenuItem>
          {folderContextMenu}

          {shouldShowSubItems && (
            <SidebarMenuAction onClick={() => toggleFolder(folder.id)}>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </SidebarMenuAction>
          )}
        </SidebarMenuItem>

        {shouldShowSubItems && isExpanded && (
          <SidebarMenuSub>
            {/* Render real projects in this folder */}
            {folder.projects.map((project) => {
              const projectContextMenu = shouldShowContextMenu() ? (
                <ContextMenu>
                  <ContextMenuTrigger asChild>
                    <SidebarMenuSubButton
                      asChild
                      isActive={pathname === `/vault/projects/${project.id}`}
                    >
                      <Link href={`/vault/projects/${project.id}`}>
                        <Music className="h-4 w-4" />
                        <span>{project.name}</span>
                        <span className="ml-auto text-muted-foreground text-xs">
                          {project.trackCount}
                        </span>
                      </Link>
                    </SidebarMenuSubButton>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-48">
                    <ContextMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        handleRename({
                          id: project.id,
                          name: project.name,
                          type: 'project',
                          parentId: folder.id,
                        });
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                      Rename
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        handleMove({
                          id: project.id,
                          name: project.name,
                          type: 'project',
                          parentId: folder.id,
                        });
                      }}
                    >
                      <Move className="h-4 w-4" />
                      Move to Folder
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete({
                          id: project.id,
                          name: project.name,
                          type: 'project',
                          parentId: folder.id,
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ) : (
                <SidebarMenuSubButton
                  asChild
                  isActive={pathname === `/vault/projects/${project.id}`}
                >
                  <Link href={`/vault/projects/${project.id}`}>
                    <Music className="h-4 w-4" />
                    <span>{project.name}</span>
                    <span className="ml-auto text-muted-foreground text-xs">
                      {project.trackCount}
                    </span>
                  </Link>
                </SidebarMenuSubButton>
              );

              return (
                <SidebarMenuSubItem key={project.id}>
                  {projectContextMenu}
                </SidebarMenuSubItem>
              );
            })}

            {/* Render real subfolders recursively */}
            {folder.subfolders.map((subfolder) =>
              renderFolder(subfolder, level + 1)
            )}
          </SidebarMenuSub>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
          Vault
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <Folder className="h-4 w-4" />
                <span>Loading...</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (!vaultData) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
          Vault
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <FolderOpen className="h-4 w-4" />
                <span>No content yet</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const { folders = [], rootProjects = [] } = vaultData;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
        Vault
      </SidebarGroupLabel>

      {/* Quick create action - proper sidebar style */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarGroupAction title="Add Folder or Project">
            <Plus />
            <span className="sr-only">Add Folder or Project</span>
          </SidebarGroupAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="right">
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

      <SidebarGroupContent>
        <SidebarMenu>
          {/* Root level projects */}
          {rootProjects.map((project) => {
            const rootProjectContextMenu = shouldShowContextMenu() ? (
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/vault/projects/${project.id}`}
                  >
                    <Link href={`/vault/projects/${project.id}`}>
                      <Music className="h-4 w-4" />
                      <span>{project.name}</span>
                      <span className="ml-auto text-muted-foreground text-xs">
                        {project.trackCount}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  <ContextMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      handleRename({
                        id: project.id,
                        name: project.name,
                        type: 'project',
                        parentId: null,
                      });
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                    Rename
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      handleMove({
                        id: project.id,
                        name: project.name,
                        type: 'project',
                        parentId: null,
                      });
                    }}
                  >
                    <Move className="h-4 w-4" />
                    Move to Folder
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    className="text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete({
                        id: project.id,
                        name: project.name,
                        type: 'project',
                        parentId: null,
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ) : (
              <SidebarMenuButton
                asChild
                isActive={pathname === `/vault/projects/${project.id}`}
              >
                <Link href={`/vault/projects/${project.id}`}>
                  <Music className="h-4 w-4" />
                  <span>{project.name}</span>
                  <span className="ml-auto text-muted-foreground text-xs">
                    {project.trackCount}
                  </span>
                </Link>
              </SidebarMenuButton>
            );

            return (
              <SidebarMenuItem key={project.id}>
                {rootProjectContextMenu}
              </SidebarMenuItem>
            );
          })}

          {/* Root level folders */}
          {folders.map((folder: SidebarFolder) => renderFolder(folder))}

          {/* Empty state */}
          {folders.length === 0 && rootProjects.length === 0 && (
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <FolderOpen className="h-4 w-4" />
                <span>No content yet</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>

      {/* Dialogs triggered by dropdown */}
      <CreateFolderDialog
        onOpenChange={setShowCreateFolderDialog}
        onSuccess={() => setShowCreateFolderDialog(false)}
        open={showCreateFolderDialog}
      />
      <CreateProjectDialog
        onOpenChange={setShowCreateProjectDialog}
        onSuccess={() => setShowCreateProjectDialog(false)}
        open={showCreateProjectDialog}
      />

      {/* Consolidated Context Menu Dialogs */}
      <RenameDialog
        isLoading={isRenamingFolder || isRenamingProject}
        itemName={selectedItem?.name || ''}
        itemType={selectedItem?.type || 'folder'}
        onOpenChange={setShowRenameDialog}
        onSubmit={handleRenameSubmit}
        open={showRenameDialog}
      />

      <DeleteDialog
        isLoading={isDeletingFolder || isDeletingProject}
        itemName={selectedItem?.name || ''}
        itemType={selectedItem?.type || 'folder'}
        onConfirm={handleDeleteConfirm}
        onOpenChange={setShowDeleteDialog}
        open={showDeleteDialog}
      />

      <MoveDialog
        currentFolderId={selectedItem?.parentId}
        excludeFolderId={
          selectedItem?.type === 'folder' ? selectedItem.id : undefined
        }
        isLoading={isMovingFolder || isMovingProject}
        itemName={selectedItem?.name || ''}
        itemType={selectedItem?.type || 'folder'}
        onOpenChange={setShowMoveDialog}
        onSubmit={handleMoveSubmit}
        open={showMoveDialog}
      />
    </SidebarGroup>
  );
}
