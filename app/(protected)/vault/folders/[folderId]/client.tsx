'use client';

import { Folder } from 'lucide-react';
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Virtuoso } from 'react-virtuoso';
import {
  useCombineProjectsAction,
  useMoveFolderAction,
  useMoveProjectAction,
} from '@/actions/vault/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { BulkActionsToolbar } from '@/components/vault/bulk-actions-toolbar';
import { DndLayout } from '@/components/vault/dnd-layout';
import { FolderCard } from '@/components/vault/folders/card';
import { CreateFolderDialog } from '@/components/vault/folders/create-dialog';
import { ProjectCard } from '@/components/vault/projects/card';
import { CreateProjectDialog } from '@/components/vault/projects/create-dialog';
import { useFolder } from '@/hooks/data/use-folder';
import { useIsTablet } from '@/hooks/use-mobile';
import { useVaultSelection } from '@/hooks/vault/use-vault-selection';
import type { FolderWithProjects } from '@/lib/contracts/folder';
import type { VaultItem as SelectionVaultItem } from '@/state/vault-selection-atoms';

interface FolderViewProps {
  folderId: string;
}

type FolderItem =
  | {
      type: 'folder';
      data: NonNullable<FolderWithProjects['subFolders']>[number];
    }
  | { type: 'project'; data: FolderWithProjects['projects'][number] };

export function FolderView({ folderId }: FolderViewProps) {
  const isTablet = useIsTablet();
  const [, moveFolderAction] = useMoveFolderAction();
  const [, moveProjectAction] = useMoveProjectAction();
  const [, combineProjectsAction] = useCombineProjectsAction();

  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);

  const { data: folderData } = useFolder(folderId);

  // Selection functionality
  const {
    selectedItems,
    isItemSelected,
    handleItemClick,
    handleKeyDown,
    clearSelection,
  } = useVaultSelection();

  // Combine subfolders and projects into a single array for virtualization
  const folderItems = useMemo((): FolderItem[] => {
    if (!folderData) return [];

    const items: FolderItem[] = [
      ...(folderData.subFolders || []).map((subFolder) => ({
        type: 'folder' as const,
        data: subFolder,
      })),
      ...folderData.projects.map((project) => ({
        type: 'project' as const,
        data: project,
      })),
    ];
    return items;
  }, [folderData]);

  // Convert to selection format for hooks
  const selectionItems = useMemo((): SelectionVaultItem[] => {
    return folderItems.map((item) => ({
      id: item.data.id,
      type: item.type,
      name: item.data.name,
    }));
  }, [folderItems]);

  const handleCreateFolderWithSelection = useCallback(() => {
    setShowCreateFolderDialog(true);
  }, []);

  const handleBulkDelete = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDownEvent = (event: KeyboardEvent) => {
      handleKeyDown(
        event,
        selectionItems,
        handleCreateFolderWithSelection,
        handleBulkDelete
      );
    };

    document.addEventListener('keydown', handleKeyDownEvent);
    return () => document.removeEventListener('keydown', handleKeyDownEvent);
  }, [
    handleKeyDown,
    selectionItems,
    handleCreateFolderWithSelection,
    handleBulkDelete,
  ]);

  if (!folderData) {
    return <div>Loading...</div>;
  }

  const handleMoveFolder = async (
    folderId: string,
    parentFolderId: string | null,
    sourceParentFolderId: string | null
  ) => {
    const formData = new FormData();
    formData.append('folderId', folderId);
    formData.append('parentFolderId', parentFolderId || '');
    formData.append('sourceParentFolderId', sourceParentFolderId || '');

    startTransition(() => {
      moveFolderAction(formData);
    });
  };

  const handleMoveProject = async (
    projectId: string,
    folderId: string | null,
    sourceFolderId: string | null
  ) => {
    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('folderId', folderId || '');
    formData.append('sourceFolderId', sourceFolderId || '');

    startTransition(() => {
      moveProjectAction(formData);
    });
  };

  const handleCombineProjects = async (
    sourceProjectId: string,
    targetProjectId: string
  ) => {
    const formData = new FormData();
    formData.append('sourceProjectId', sourceProjectId);
    formData.append('targetProjectId', targetProjectId);
    formData.append('parentFolderId', folderData.id);

    startTransition(() => {
      combineProjectsAction(formData);
    });
  };

  // Calculate grid columns based on screen size
  const ITEMS_PER_ROW = 4;

  const renderItem = (index: number) => {
    const item = folderItems[index];
    if (!item) return null;

    const isSelected = isItemSelected(item.data.id);
    const handleClick = (event: React.MouseEvent) => {
      handleItemClick(item.data.id, event, selectionItems);
    };

    if (item.type === 'folder') {
      return (
        <FolderCard
          folder={item.data}
          isDragAndDropEnabled={true}
          isSelected={isSelected}
          key={item.data.id}
          onSelectionClick={handleClick}
          parentFolderId={folderData.id}
          showProjectCount={false}
        />
      );
    }
    return (
      <ProjectCard
        folderId={folderData.id}
        isDragAndDropEnabled={true}
        isSelected={isSelected}
        key={item.data.id}
        onSelectionClick={handleClick}
        project={item.data}
        trackCount={item.data.trackCount}
      />
    );
  };

  return (
    <DndLayout
      className="space-y-4 rounded-lg border border-border p-4"
      droppableData={{ type: 'folder', id: folderData.id }}
      droppableId={`folder-${folderData.id}`}
      onClearSelection={clearSelection}
      onCombineProjects={handleCombineProjects}
      onCreateFolder={() => setShowCreateFolderDialog(true)}
      onCreateProject={() => setShowCreateProjectDialog(true)}
      onMoveFolder={handleMoveFolder}
      onMoveProject={handleMoveProject}
    >
      {/* Folder Info */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="font-semibold text-2xl">{folderData.name}</h1>
          <p className="text-muted-foreground">
            {folderData.subFolders?.length || 0}{' '}
            {(folderData.subFolders?.length || 0) === 1 ? 'folder' : 'folders'},{' '}
            {folderData.projects.length}{' '}
            {folderData.projects.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
      </div>

      {/* Folders and Projects Grid */}
      {folderItems.length > 0 ? (
        <div style={{ height: '600px' }}>
          <Virtuoso
            itemContent={(rowIndex) =>
              isTablet ? (
                <div className="mb-4 flex flex-wrap justify-center gap-4">
                  {Array.from({ length: ITEMS_PER_ROW }, (_, colIndex) => {
                    const itemIndex = rowIndex * ITEMS_PER_ROW + colIndex;
                    return itemIndex < folderItems.length ? (
                      <div className="w-40 flex-shrink-0" key={itemIndex}>
                        {renderItem(itemIndex)}
                      </div>
                    ) : null;
                  })}
                </div>
              ) : (
                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-3 xl:grid-cols-6 xl:gap-4">
                  {Array.from({ length: ITEMS_PER_ROW }, (_, colIndex) => {
                    const itemIndex = rowIndex * ITEMS_PER_ROW + colIndex;
                    return itemIndex < folderItems.length ? (
                      <div key={itemIndex}>{renderItem(itemIndex)}</div>
                    ) : null;
                  })}
                </div>
              )
            }
            style={{ height: '100%' }}
            totalCount={Math.ceil(folderItems.length / ITEMS_PER_ROW)}
          />
        </div>
      ) : (
        /* Empty state */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold">Empty folder</h3>
            <p className="mb-4 text-muted-foreground text-sm">
              Create folders or projects to organize your content
            </p>
            <CreateProjectDialog
              folderId={folderData.id}
              triggerText="Create Project"
            />
          </CardContent>
        </Card>
      )}

      {/* Context Menu Dialogs */}
      <CreateFolderDialog
        onOpenChange={setShowCreateFolderDialog}
        onSuccess={() => {
          setShowCreateFolderDialog(false);
          clearSelection();
        }}
        open={showCreateFolderDialog}
        parentFolderId={folderData.id}
        selectedItems={selectedItems.map((id) => {
          const item = selectionItems.find((item) => item.id === id);
          return item
            ? { id: item.id, type: item.type }
            : { id, type: 'project' as const };
        })}
      />
      <CreateProjectDialog
        folderId={folderData.id}
        onOpenChange={setShowCreateProjectDialog}
        onSuccess={() => setShowCreateProjectDialog(false)}
        open={showCreateProjectDialog}
      />

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        parentFolderId={folderData.id}
        vaultItems={selectionItems}
      />
    </DndLayout>
  );
}
