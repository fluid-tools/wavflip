'use client';

import type { ReactNode } from 'react';
import type { DropData } from '@/components/vault/dnd';
import { DroppableWrapper, VaultDndProvider } from '@/components/vault/dnd';

type DndLayoutProps = {
  children: ReactNode;
  droppableId: string;
  droppableData: DropData;
  onMoveFolder: (
    folderId: string,
    destinationFolderId: string | null,
    sourceFolderId: string | null
  ) => Promise<void>;
  onMoveProject: (
    projectId: string,
    destinationFolderId: string | null,
    sourceFolderId: string | null
  ) => Promise<void>;
  onCombineProjects: (
    sourceProjectId: string,
    targetProjectId: string
  ) => Promise<void>;
  onCreateFolder?: () => void;
  onCreateProject?: () => void;
  onClearSelection?: () => void;
  className?: string;
};

export function DndLayout({
  children,
  droppableId,
  droppableData,
  onMoveFolder,
  onMoveProject,
  onCombineProjects,
  className = 'p-6 space-y-6 min-h-screen',
}: DndLayoutProps) {
  return (
    <VaultDndProvider
      onCombineProjects={onCombineProjects}
      onMoveFolder={onMoveFolder}
      onMoveProject={onMoveProject}
    >
      <DroppableWrapper
        applyRoundedCorners={false}
        className={className}
        data={droppableData}
        id={droppableId}
      >
        {children}
      </DroppableWrapper>
    </VaultDndProvider>
  );
}
