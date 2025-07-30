'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import { FolderPlus, Music, Undo, Copy, Trash2 } from 'lucide-react'
import { forwardRef, memo } from 'react'
import type { DropData, ItemType } from './types'

interface DroppableWrapperProps {
  id: string
  data: DropData
  children: React.ReactNode
  className?: string
  disabled?: boolean
  showContextMenu?: boolean
  onCreateFolder?: () => void
  onCreateProject?: () => void
  onUndo?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  accepts?: ItemType[]
  highlightOnHover?: boolean
}

export const DroppableWrapper = memo(forwardRef<HTMLDivElement, DroppableWrapperProps>(
  function DroppableWrapper({
    id,
    data,
    children,
    className,
    disabled = false,
    showContextMenu = false,
    onCreateFolder,
    onCreateProject,
    onUndo,
    onDuplicate,
    onDelete,
    accepts,
    highlightOnHover = true,
  }, ref) {
    const { isOver, active, setNodeRef } = useDroppable({
      id,
      data: { ...data, accepts },
      disabled,
    })

    const canDrop = active && (!accepts || accepts.includes(active.data.current?.type))
    const isValidDrop = isOver && canDrop

    const droppableContent = (
      <div
        ref={(node) => {
          setNodeRef(node)
          if (ref) {
            if (typeof ref === 'function') ref(node)
            else ref.current = node
          }
        }}
        className={cn(
          'relative transition-all duration-200',
          highlightOnHover && isValidDrop && [
            'bg-primary/5 ring-2 ring-primary/50 ring-inset',
            'before:absolute before:inset-0 before:bg-gradient-to-b before:from-primary/10 before:to-transparent before:pointer-events-none',
          ],
          highlightOnHover && isOver && !canDrop && 'opacity-50',
          className
        )}
        aria-dropeffect={canDrop ? 'move' : 'none'}
      >
        {children}
      </div>
    )

    if (showContextMenu) {
      return (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            {droppableContent}
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            {onCreateFolder && (
              <ContextMenuItem onClick={onCreateFolder}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </ContextMenuItem>
            )}
            {onCreateProject && (
              <ContextMenuItem onClick={onCreateProject}>
                <Music className="h-4 w-4 mr-2" />
                New Project
              </ContextMenuItem>
            )}
            {(onCreateFolder || onCreateProject) && (onUndo || onDuplicate || onDelete) && (
              <div className="h-px bg-border my-1" />
            )}
            {onUndo && (
              <ContextMenuItem onClick={onUndo}>
                <Undo className="h-4 w-4 mr-2" />
                Undo Last Move
              </ContextMenuItem>
            )}
            {onDuplicate && (
              <ContextMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </ContextMenuItem>
            )}
            {onDelete && (
              <ContextMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </ContextMenuItem>
            )}
          </ContextMenuContent>
        </ContextMenu>
      )
    }

    return droppableContent
  }
))