'use client'

import { useMemo, startTransition, useState, useEffect, useCallback } from 'react'
import { Folder } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { FolderWithProjects } from '@/db/schema/vault'
import { CreateProjectDialog } from '@/components/vault/projects/create-dialog'
import { CreateFolderDialog } from '@/components/vault/folders/create-dialog'
import { FolderCard } from '@/components/vault/folders/card'
import { ProjectCard } from '@/components/vault/projects/card'
import { ViewToggle } from '@/components/vault/view-toggle'
import { Virtuoso } from 'react-virtuoso'
import { DndLayout } from '@/components/vault/dnd-layout'
import { useMoveFolderAction, useMoveProjectAction, useCombineProjectsAction } from '@/actions/use-vault-action'
import { useFolder } from '@/hooks/data/use-vault'
import { useVaultSelection } from '@/hooks/use-vault-selection'
import type { VaultItem as SelectionVaultItem } from '@/state/vault-selection-atoms'
import { BulkActionsToolbar } from '@/components/vault/bulk-actions-toolbar'


interface FolderViewProps {
  folderId: string
}

type FolderItem = 
  | { type: 'folder'; data: NonNullable<FolderWithProjects['subFolders']>[number] }
  | { type: 'project'; data: FolderWithProjects['projects'][number] }

export function FolderView({ folderId }: FolderViewProps) {
  const [, moveFolderAction] = useMoveFolderAction()
  const [, moveProjectAction] = useMoveProjectAction()
  const [, combineProjectsAction] = useCombineProjectsAction()
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false)
  
  const { data: folderData } = useFolder(folderId)
  
  // Selection functionality
  const {
    selectedItems,
    isItemSelected,
    handleItemClick,
    handleKeyDown,
    clearSelection,
    selectedCount,
    touchSelectionMode
  } = useVaultSelection()

  // Combine subfolders and projects into a single array for virtualization
  const folderItems = useMemo((): FolderItem[] => {
    if (!folderData) return []
    
    const items: FolderItem[] = [
      ...(folderData.subFolders || []).map(subFolder => ({ type: 'folder' as const, data: subFolder })),
      ...folderData.projects.map(project => ({ type: 'project' as const, data: project }))
    ]
    return items
  }, [folderData])

  // Convert to selection format for hooks
  const selectionItems = useMemo((): SelectionVaultItem[] => {
    return folderItems.map(item => ({
      id: item.data.id,
      type: item.type,
      name: item.data.name
    }))
  }, [folderItems])

  const handleCreateFolderWithSelection = useCallback(() => {
    setShowCreateFolderDialog(true)
  }, [])

  const handleBulkDelete = useCallback(() => {
    clearSelection()
  }, [clearSelection])

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDownEvent = (event: KeyboardEvent) => {
      handleKeyDown(event, selectionItems, handleCreateFolderWithSelection, handleBulkDelete)
    }

    document.addEventListener('keydown', handleKeyDownEvent)
    return () => document.removeEventListener('keydown', handleKeyDownEvent)
  }, [handleKeyDown, selectionItems, handleCreateFolderWithSelection, handleBulkDelete])
  
  if (!folderData) {
    return <div>Loading...</div>
  }
  
  const handleMoveFolder = async (
    folderId: string, 
    parentFolderId: string | null, 
    sourceParentFolderId: string | null
  ) => {
    const formData = new FormData()
    formData.append('folderId', folderId)
    formData.append('parentFolderId', parentFolderId || '')
    formData.append('sourceParentFolderId', sourceParentFolderId || '')
    
    startTransition(() => {
      moveFolderAction(formData)
    })
  }

  const handleMoveProject = async (
    projectId: string, 
    folderId: string | null, 
    sourceFolderId: string | null
  ) => {
    const formData = new FormData()
    formData.append('projectId', projectId)
    formData.append('folderId', folderId || '')
    formData.append('sourceFolderId', sourceFolderId || '')
    
    startTransition(() => {
      moveProjectAction(formData)
    })
  }

  const handleCombineProjects = async (sourceProjectId: string, targetProjectId: string) => {
    const formData = new FormData()
    formData.append('sourceProjectId', sourceProjectId)
    formData.append('targetProjectId', targetProjectId)
    formData.append('parentFolderId', folderData.id)
    
    startTransition(() => {
      combineProjectsAction(formData)
    })
  }

  // Calculate grid columns based on screen size
  const ITEMS_PER_ROW = 4

  const renderItem = (index: number) => {
    const item = folderItems[index]
    if (!item) return null

    const isSelected = isItemSelected(item.data.id)
    const handleClick = (event: React.MouseEvent) => {
      handleItemClick(item.data.id, event, selectionItems)
    }

    if (item.type === 'folder') {
      return (
        <FolderCard 
          key={item.data.id} 
          folder={item.data} 
          showProjectCount={false}
          parentFolderId={folderData.id}
          isDragAndDropEnabled={true}
          isSelected={isSelected}
          onSelectionClick={handleClick}
        />
      )
    } else {
      return (
        <ProjectCard 
          key={item.data.id} 
          project={item.data} 
          folderId={folderData.id}
          trackCount={item.data.trackCount}
          isDragAndDropEnabled={true}
          isSelected={isSelected}
          onSelectionClick={handleClick}
        />
      )
    }
  }

  return (
    <DndLayout
      droppableId={`folder-${folderData.id}`}
      droppableData={{ type: 'folder', id: folderData.id }}
      onMoveFolder={handleMoveFolder}
      onMoveProject={handleMoveProject}
      onCombineProjects={handleCombineProjects}
      onCreateFolder={() => setShowCreateFolderDialog(true)}
      onCreateProject={() => setShowCreateProjectDialog(true)}
      onClearSelection={clearSelection}
      className="p-6 space-y-6 min-h-screen"
    >
      {/* Folder Info */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{folderData.name}</h1>
          <p className="text-muted-foreground">
            {folderData.subFolders?.length || 0} {(folderData.subFolders?.length || 0) === 1 ? 'folder' : 'folders'}, {folderData.projects.length} {folderData.projects.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
        <ViewToggle />
      </div>

      {/* Folders and Projects Grid */}
      {folderItems.length > 0 ? (
        <div style={{ height: '600px' }}>
          <Virtuoso
            style={{ height: '100%' }}
            totalCount={Math.ceil(folderItems.length / ITEMS_PER_ROW)}
            itemContent={(rowIndex) => (
              <div className="flex flex-wrap gap-4 mb-4">
                {Array.from({ length: ITEMS_PER_ROW }, (_, colIndex) => {
                  const itemIndex = rowIndex * ITEMS_PER_ROW + colIndex
                  return itemIndex < folderItems.length ? (
                    <div key={itemIndex}>
                      {renderItem(itemIndex)}
                    </div>
                  ) : null
                })}
              </div>
            )}
          />
        </div>
      ) : (
        /* Empty state */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Empty folder</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create folders or projects to organize your content
            </p>
            <CreateProjectDialog folderId={folderData.id} triggerText="Create Project" />
          </CardContent>
        </Card>
      )}

      {/* Context Menu Dialogs */}
      <CreateFolderDialog 
        parentFolderId={folderData.id}
        open={showCreateFolderDialog}
        onOpenChange={setShowCreateFolderDialog}
        selectedItems={selectedItems.map(id => {
          const item = selectionItems.find(item => item.id === id)
          return item ? { id: item.id, type: item.type } : { id, type: 'project' as const }
        })}
        onSuccess={() => {
          setShowCreateFolderDialog(false)
          clearSelection()
        }}
      />
      <CreateProjectDialog 
        folderId={folderData.id}
        open={showCreateProjectDialog}
        onOpenChange={setShowCreateProjectDialog}
        onSuccess={() => setShowCreateProjectDialog(false)}
      />

      {/* Bulk Actions Toolbar - Always show when touch selection mode is active */}
      {(selectedCount > 0 || touchSelectionMode) && (
        <BulkActionsToolbar vaultItems={selectionItems} parentFolderId={folderData.id} />
      )}
    </DndLayout>
  )
} 