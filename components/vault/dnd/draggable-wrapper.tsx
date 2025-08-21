'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { forwardRef, memo } from 'react';
import { cn } from '@/lib/utils';
import type { DragData } from './types';

interface DraggableWrapperProps {
  id: string;
  data: DragData;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  dragHandleClassName?: string;
  isDragHandle?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export const DraggableWrapper = memo(
  forwardRef<HTMLDivElement, DraggableWrapperProps>(function DraggableWrapper(
    {
      id,
      data,
      children,
      disabled = false,
      className,
      dragHandleClassName,
      isDragHandle = false,
      onDragStart,
      onDragEnd,
    },
    ref
  ) {
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
    });

    const style = {
      transform: CSS.Translate.toString(transform),
      opacity: isDragging ? 1 : 1,
      transition: isDragging
        ? 'none'
        : 'transform 200ms ease, opacity 200ms ease',
    };

    const dragProps = isDragHandle ? {} : { ...listeners, ...attributes };

    return (
      <div
        className={cn(
          'relative rounded-lg',
          isDragging
            ? 'z-50 cursor-grabbing border-2 border-primary/50 opacity-90 shadow-lg'
            : 'cursor-grab',
          'touch-none select-none',
          className
        )}
        ref={(node) => {
          setNodeRef(node);
          if (ref) {
            if (typeof ref === 'function') ref(node);
            else ref.current = node;
          }
        }}
        style={style}
        {...dragProps}
        onPointerDown={(e) => {
          if (!isDragHandle && listeners?.onPointerDown) {
            listeners.onPointerDown(e);
          }
          onDragStart?.();
        }}
        onPointerUp={(e) => {
          if (!isDragHandle && listeners?.onPointerUp) {
            listeners.onPointerUp(e);
          }
          onDragEnd?.();
        }}
      >
        {isDragHandle && (
          <div
            className={cn(
              'absolute inset-y-0 left-0 flex w-8 items-center justify-center',
              'cursor-grab active:cursor-grabbing',
              dragHandleClassName
            )}
            ref={setActivatorNodeRef}
            {...listeners}
            {...attributes}
          >
            <div className="h-8 w-1 rounded-full bg-border opacity-50 transition-opacity hover:opacity-100" />
          </div>
        )}
        {children}
      </div>
    );
  })
);
