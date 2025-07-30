'use client'

import { ReactNode } from 'react'
import { VaultDndProvider, type DropData } from './dnd/context'
import { DroppableWrapper } from './dnd/droppable-wrapper'

interface DndLayoutProps {
  children: ReactNode
  droppableId: string
  droppableData: DropData
  onMoveFolder: (folderId: string, destinationFolderId: string | null, sourceFolderId: string | null) => Promise<void>
  onMoveProject: (projectId: string, destinationFolderId: string | null, sourceFolderId: string | null) => Promise<void>
  onCombineProjects: (sourceProjectId: string, targetProjectId: string) => Promise<void>
  onCreateFolder?: () => void
  onCreateProject?: () => void
  className?: string
}

export function DndLayout({
  children,
  droppableId,
  droppableData,
  onMoveFolder,
  onMoveProject,
  onCombineProjects,
  onCreateFolder,
  onCreateProject,
  className = "p-6 space-y-6 min-h-screen"
}: DndLayoutProps) {
  return (
    <VaultDndProvider
      onMoveFolder={onMoveFolder}
      onMoveProject={onMoveProject}
      onCombineProjects={onCombineProjects}
    >
      <DroppableWrapper 
        id={droppableId}
        data={droppableData}
        className={className}
        showContextMenu={true}
        onCreateFolder={onCreateFolder}
        onCreateProject={onCreateProject}
      >
        {children}
      </DroppableWrapper>
    </VaultDndProvider>
  )
}