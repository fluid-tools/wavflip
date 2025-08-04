'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

import { forwardRef, memo } from 'react'
import type { DropData, ItemType } from './types'


interface DroppableWrapperProps {
  id: string
  data: DropData
  children: React.ReactNode
  className?: string
  disabled?: boolean
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


      >
        {children}
      </div>
    )

    return droppableContent
  }
))