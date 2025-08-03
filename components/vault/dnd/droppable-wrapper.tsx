'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import { FolderPlus, Music, Undo, Copy, Trash2 } from 'lucide-react'
import { forwardRef, memo } from 'react'
import type { DropData, ItemType } from './types'
import { useContextMenuHandler } from '@/hooks/use-context-menu-handler'

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
  onClearSelection?: () => void
  accepts?: ItemType[]
  highlightOnHover?: boolean
  applyRoundedCorners?: boolean
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
    onClearSelection,
    accepts,
    highlightOnHover = true,
    applyRoundedCorners = true,
  }, ref) {
    const { isOver, active, setNodeRef } = useDroppable({
      id,
      data: { ...data, accepts },
      disabled,
    })

    const canDrop = active && (!accepts || accepts.includes(active.data.current?.type))
    const isValidDrop = isOver && canDrop
    
    const { handleContextMenu, shouldShowContextMenu } = useContextMenuHandler()

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
          'transition-colors duration-200',
          applyRoundedCorners && 'rounded-lg',
          highlightOnHover && isValidDrop && 'opacity-90 shadow-lg border-2 border-primary/50',
          className
        )}

        onClick={(e) => {
          // Clear selection when clicking on empty space
          if (e.target === e.currentTarget && onClearSelection) {
            onClearSelection()
          }
        }}
        onContextMenu={(e) => {
          // Only show layout context menu if clicking on the layout itself, not on child items
          if (e.target === e.currentTarget) {
            // Handle layout context menu - this will check for item menu conflicts on touch
            const shouldShow = handleContextMenu(e, { isLayoutMenu: true })
            if (!shouldShow) {
              e.preventDefault()
              e.stopPropagation()
            }
          } else {
            // Prevent layout context menu when clicking on items
            e.preventDefault()
            e.stopPropagation()
          }
        }}
      >
        {children}
      </div>
    )

    if (showContextMenu && shouldShowContextMenu) {
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