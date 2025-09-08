'use client';

import { useAtomValue } from 'jotai';
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
import { useRootFolders } from '@/hooks/data/use-folder';
import { useRootProjects } from '@/hooks/data/use-project';
import { useIsTablet } from '@/hooks/use-mobile';
import { useVaultSelection } from '@/hooks/vault/use-vault-selection';
import type { FolderWithProjects } from '@/lib/contracts/folder';
import type { ProjectWithTracks } from '@/lib/contracts/project';
import type { VaultItem as SelectionVaultItem } from '@/state/vault-selection-atoms';
import { selectedItemsAtom } from '@/state/vault-selection-atoms';

type VaultItem =
  | { type: 'folder'; data: FolderWithProjects }
  | { type: 'project'; data: ProjectWithTracks };

export default function VaultPage() {
  const isTablet = useIsTablet();
  const { execute: moveFolderExecute } = useMoveFolderAction();
  const { execute: moveProjectExecute } = useMoveProjectAction();
  const { execute: combineProjectsExecute } = useCombineProjectsAction();
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);

  // Use React Query with hydrated data
  const { data: folders = [] } = useRootFolders();
  const { data: projects = [] } = useRootProjects();

  // Selection functionality
  const { selectedItems, handleItemClick, handleKeyDown, clearSelection } =
    useVaultSelection();

  // Get stable selection state directly from atom for O(1) lookups
  const selectedItemsSet = useAtomValue(selectedItemsAtom);

  const handleMoveFolder = async (
    folderId: string,
    parentFolderId: string | null,
    sourceParentFolderId: string | null
  ) => {
    startTransition(() => {
      moveFolderExecute({
        folderId,
        parentFolderId,
        sourceParentFolderId,
      });
    });
  };

  const handleMoveProject = async (
    projectId: string,
    folderId: string | null,
    sourceFolderId: string | null
  ) => {
    startTransition(() => {
      moveProjectExecute({
        projectId,
        folderId,
        sourceFolderId,
      });
    });
  };

  const handleCombineProjects = async (
    sourceProjectId: string,
    targetProjectId: string
  ) => {
    startTransition(() => {
      combineProjectsExecute({
        sourceProjectId,
        targetProjectId,
        parentFolderId: null, // For vault view, combined projects should be created at root level
      });
    });
  };

  // Combine folders and projects into a single array for virtualization
  const vaultItems = useMemo((): VaultItem[] => {
    const items: VaultItem[] = [
      ...folders.map((folder) => ({ type: 'folder' as const, data: folder })),
      ...projects.map((project) => ({
        type: 'project' as const,
        data: project,
      })),
    ];
    return items;
  }, [folders, projects]);

  // Create stable selection items - only changes when vault items change
  const selectionItems = useMemo((): SelectionVaultItem[] => {
    return vaultItems.map((item) => ({
      id: item.data.id,
      type: item.type,
      name: item.data.name,
    }));
  }, [vaultItems]);

  // Create stable click handlers map - prevents re-renders
  const clickHandlers = useMemo(() => {
    const handlers = new Map<string, (event: React.MouseEvent) => void>();
    vaultItems.forEach((item) => {
      handlers.set(item.data.id, (event: React.MouseEvent) => {
        handleItemClick(item.data.id, event, selectionItems);
      });
    });
    return handlers;
  }, [vaultItems, handleItemClick, selectionItems]);

  const handleCreateFolderWithSelection = useCallback(() => {
    setShowCreateFolderDialog(true);
  }, []);

  const handleBulkDelete = useCallback(() => {
    // This would trigger the bulk delete dialog from BulkActionsToolbar
    // For now, we'll just clear selection
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

  // Calculate grid columns based on screen size
  const ITEMS_PER_ROW = 4;

  const renderItem = useCallback(
    (index: number) => {
      const item = vaultItems[index];
      if (!item) {
        return null;
      }

      // Use stable atom value for O(1) lookup - no function recreation
      const isSelected = selectedItemsSet.has(item.data.id);
      // Get stable click handler from map - no function recreation
      const handleClick = clickHandlers.get(item.data.id)!;

      if (item.type === 'folder') {
        return (
          <FolderCard
            folder={item.data}
            isDragAndDropEnabled={true}
            isSelected={isSelected}
            key={item.data.id}
            onSelectionClick={handleClick}
            parentFolderId={null}
          />
        );
      }
      return (
        <ProjectCard
          folderId={null}
          isDragAndDropEnabled={true}
          isSelected={isSelected}
          key={item.data.id}
          onSelectionClick={handleClick}
          project={item.data}
          trackCount={item.data.trackCount}
        />
      );
    },
    [vaultItems, selectedItemsSet, clickHandlers]
  );

  return (
    <>
      <DndLayout
        className="space-y-4 rounded-lg border border-border bg-card/5 px-2 py-6 backdrop-blur-sm sm:px-4 sm:py-4"
        droppableData={{ type: 'vault' }}
        droppableId="vault"
        onClearSelection={clearSelection}
        onCombineProjects={handleCombineProjects}
        onCreateFolder={() => setShowCreateFolderDialog(true)}
        onCreateProject={() => setShowCreateProjectDialog(true)}
        onMoveFolder={handleMoveFolder}
        onMoveProject={handleMoveProject}
      >
        {vaultItems.length > 0 ? (
          <div style={{ height: '600px' }}>
            <Virtuoso
              itemContent={(rowIndex) =>
                isTablet ? (
                  <div className="mb-4 flex flex-wrap justify-center gap-4">
                    {Array.from({ length: ITEMS_PER_ROW }, (_, colIndex) => {
                      const itemIndex = rowIndex * ITEMS_PER_ROW + colIndex;
                      return itemIndex < vaultItems.length ? (
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
                      return itemIndex < vaultItems.length ? (
                        <div key={itemIndex}>{renderItem(itemIndex)}</div>
                      ) : null;
                    })}
                  </div>
                )
              }
              style={{ height: '100%' }}
              totalCount={Math.ceil(vaultItems.length / ITEMS_PER_ROW)}
            />
          </div>
        ) : (
          /* Empty state */
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Folder className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-semibold">No folders or projects yet</h3>
              <p className="mb-4 text-muted-foreground text-sm">
                Start organizing your tracks by creating folders and projects
              </p>
              <div className="flex gap-2">
                <CreateFolderDialog />
                <CreateProjectDialog triggerText="Create Project" />
              </div>
            </CardContent>
          </Card>
        )}
      </DndLayout>

      {/* Context Menu Dialogs */}
      <CreateFolderDialog
        onOpenChange={setShowCreateFolderDialog}
        onSuccess={() => {
          setShowCreateFolderDialog(false);
          clearSelection();
        }}
        open={showCreateFolderDialog}
        selectedItems={selectedItems.map((id) => {
          const item = selectionItems.find((item) => item.id === id);
          return item
            ? { id: item.id, type: item.type }
            : { id, type: 'project' as const };
        })}
      />
      <CreateProjectDialog
        onOpenChange={setShowCreateProjectDialog}
        onSuccess={() => setShowCreateProjectDialog(false)}
        open={showCreateProjectDialog}
      />

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar vaultItems={selectionItems} />
    </>
  );
}
