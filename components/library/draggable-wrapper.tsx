'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { DragData } from './dnd-context'

interface DraggableWrapperProps {
  id: string
  data: DragData
  children: React.ReactNode
  disabled?: boolean
}

export function DraggableWrapper({
  id,
  data,
  children,
  disabled = false,
}: DraggableWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
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
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
    >
      {children}
    </div>
  )
} 