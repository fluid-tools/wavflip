'use client'

import { useMemo, startTransition, useState } from 'react'
import { Folder } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { FolderWithProjects, ProjectWithTracks } from '@/db/schema/vault'
import { CreateFolderDialog } from '@/components/vault/folders/create-dialog'
import { CreateProjectDialog } from '@/components/vault/projects/create-dialog'
import { FolderCard } from '@/components/vault/folders/card'
import { ProjectCard } from '@/components/vault/projects/card'
import { ViewToggle } from '@/components/vault/view-toggle'
import { Virtuoso } from 'react-virtuoso'
import { DndLayout } from '@/components/vault/dnd-layout'
import { createFolderFromProjectsAction } from '@/actions/vault'
import { useMoveFolderAction, useMoveProjectAction } from '@/actions/use-vault-action'


interface VaultViewProps {
  initialFolders: FolderWithProjects[]
  initialProjects: ProjectWithTracks[]
}

type VaultItem = 
  | { type: 'folder'; data: FolderWithProjects }
  | { type: 'project'; data: ProjectWithTracks }

export function VaultView({ initialFolders, initialProjects }: VaultViewProps) {
  const [, moveFolderAction] = useMoveFolderAction()
  const [, moveProjectAction] = useMoveProjectAction()
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false)
  // View state is now managed globally via atoms

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
    // For vault view, combined projects should be created at root level (null parent)
    formData.append('parentFolderId', '')
    
    const result = await createFolderFromProjectsAction({ success: false, error: null }, formData)
    if (result.error) {
      throw new Error(result.error)
    }
  }


  // Combine folders and projects into a single array for virtualization
  const vaultItems = useMemo((): VaultItem[] => {
    const items: VaultItem[] = [
      ...initialFolders.map(folder => ({ type: 'folder' as const, data: folder })),
      ...initialProjects.map(project => ({ type: 'project' as const, data: project }))
    ]
    return items
  }, [initialFolders, initialProjects])

  // Calculate grid columns based on screen size
  const ITEMS_PER_ROW = 4

  const renderItem = (index: number) => {
    const item = vaultItems[index]
    if (!item) return null

    if (item.type === 'folder') {
      return (
        <FolderCard 
          key={item.data.id} 
          folder={item.data} 
          parentFolderId={null}
          isDragAndDropEnabled={true}
        />
      )
    } else {
      return (
        <ProjectCard 
          key={item.data.id} 
          project={item.data} 
          folderId={null}
          trackCount={item.data.trackCount}
          isDragAndDropEnabled={true}
        />
      )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Vault Contents</h2>
        <div className="flex items-center gap-3">
          <ViewToggle />
          <div className="flex gap-2">
            <CreateFolderDialog />
            <CreateProjectDialog />
          </div>
        </div>
      </div>

      <DndLayout
        droppableId="vault"
        droppableData={{ type: 'vault' }}
        onMoveFolder={handleMoveFolder}
        onMoveProject={handleMoveProject}
        onCombineProjects={handleCombineProjects}
        onCreateFolder={() => setShowCreateFolderDialog(true)}
        onCreateProject={() => setShowCreateProjectDialog(true)}
        className="space-y-4"
      >
        {vaultItems.length > 0 ? (
          <div style={{ height: '600px' }}>
            <Virtuoso
              style={{ height: '100%' }}
              totalCount={Math.ceil(vaultItems.length / ITEMS_PER_ROW)}
              itemContent={(rowIndex) => (
                <div className="flex flex-wrap gap-4 mb-4">
                  {Array.from({ length: ITEMS_PER_ROW }, (_, colIndex) => {
                    const itemIndex = rowIndex * ITEMS_PER_ROW + colIndex
                    return itemIndex < vaultItems.length ? (
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
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Folder className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No folders or projects yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
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
        open={showCreateFolderDialog}
        onOpenChange={setShowCreateFolderDialog}
        onSuccess={() => setShowCreateFolderDialog(false)}
      />
      <CreateProjectDialog 
        open={showCreateProjectDialog}
        onOpenChange={setShowCreateProjectDialog}
        onSuccess={() => setShowCreateProjectDialog(false)}
      />
    </div>
  )
} 