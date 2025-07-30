'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { forwardRef, memo } from 'react'
import type { DragData } from './types'

interface DraggableWrapperProps {
  id: string
  data: DragData
  children: React.ReactNode
  disabled?: boolean
  className?: string
  dragHandleClassName?: string
  isDragHandle?: boolean
  onDragStart?: () => void
  onDragEnd?: () => void
}

export const DraggableWrapper = memo(forwardRef<HTMLDivElement, DraggableWrapperProps>(
  function DraggableWrapper({
    id,
    data,
    children,
    disabled = false,
    className,
    dragHandleClassName,
    isDragHandle = false,
    onDragStart,
    onDragEnd,
  }, ref) {
    const {
      attributes,
      listeners,
      setNodeRef,
      setActivatorNodeRef,
      transform,
      isDragging,
    } = useDraggable({
      id,
      data,
      disabled,
    })

    const style = {
      transform: CSS.Translate.toString(transform),
      opacity: isDragging ? 0.5 : 1,
      transition: isDragging ? 'none' : 'transform 200ms ease, opacity 200ms ease',
    }

    const dragProps = isDragHandle ? {} : { ...listeners, ...attributes }
    
    return (
      <div
        ref={(node) => {
          setNodeRef(node)
          if (ref) {
            if (typeof ref === 'function') ref(node)
            else ref.current = node
          }
        }}
        style={style}
        className={cn(
          'relative',
          isDragging ? 'z-50 cursor-grabbing' : 'cursor-grab',
          'touch-none select-none',
          className
        )}
        {...dragProps}
        onPointerDown={(e) => {
          if (!isDragHandle && listeners?.onPointerDown) {
            listeners.onPointerDown(e)
          }
          onDragStart?.()
        }}
        onPointerUp={(e) => {
          if (!isDragHandle && listeners?.onPointerUp) {
            listeners.onPointerUp(e)
          }
          onDragEnd?.()
        }}
      >
        {isDragHandle && (
          <div
            ref={setActivatorNodeRef}
            className={cn(
              'absolute inset-y-0 left-0 w-8 flex items-center justify-center',
              'cursor-grab active:cursor-grabbing',
              dragHandleClassName
            )}
            {...listeners}
            {...attributes}
          >
            <div className="w-1 h-8 bg-border rounded-full opacity-50 hover:opacity-100 transition-opacity" />
          </div>
        )}
        {children}
      </div>
    )
  }
))