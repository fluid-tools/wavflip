'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import { FolderPlus, Music } from 'lucide-react'
import type { DropData } from './context'

interface DroppableWrapperProps {
  id: string
  data: DropData
  children: React.ReactNode
  className?: string
  disabled?: boolean
  showContextMenu?: boolean
  onCreateFolder?: () => void
  onCreateProject?: () => void
}

export function DroppableWrapper({
  id,
  data,
  children,
  className,
  disabled = false,
  showContextMenu = false,
  onCreateFolder,
  onCreateProject,
}: DroppableWrapperProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data,
    disabled,
  })

  const droppableContent = (
    <div
      ref={setNodeRef}
      className={cn(
        'transition-colors duration-200',
        isOver && 'bg-muted/50 ring-2 ring-primary/50 ring-inset',
        className
      )}
    >
      {children}
    </div>
  )

  if (showContextMenu && (onCreateFolder || onCreateProject)) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {droppableContent}
        </ContextMenuTrigger>
        <ContextMenuContent>
          {onCreateFolder && (
            <ContextMenuItem onClick={onCreateFolder}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Folder
            </ContextMenuItem>
          )}
          {onCreateProject && (
            <ContextMenuItem onClick={onCreateProject}>
              <Music className="h-4 w-4 mr-2" />
              Create Project
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  return droppableContent
} 