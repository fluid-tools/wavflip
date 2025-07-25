'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import type { DropData } from './dnd-context'

interface DroppableWrapperProps {
  id: string
  data: DropData
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function DroppableWrapper({
  id,
  data,
  children,
  className,
  disabled = false,
}: DroppableWrapperProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data,
    disabled,
  })

  return (
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
} 