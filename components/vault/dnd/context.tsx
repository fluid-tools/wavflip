'use client'

import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragMoveEvent,
  closestCenter,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
} from '@dnd-kit/core'
import { useState, createContext, useContext, useCallback, useMemo, useEffect } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Folder, Music, FileAudio } from 'lucide-react'
import { toast } from 'sonner'
import { useDragHistory } from './hooks'
import type { DragData, DropData, DndCallbacks, ItemType, DragOperation } from './types'

interface VaultDndContextType {
  activeDragData: DragData | null
  selectedItems: Set<string>
  toggleSelection: (id: string) => void
  clearSelection: () => void
  onDragMove: (operation: Omit<DragOperation, 'timestamp'>) => Promise<void>
  undo: () => Promise<void>
  canDrop: (dragType: ItemType, dropType: string) => boolean
}

const VaultDndContext = createContext<VaultDndContextType | null>(null)

export function useVaultDnd() {
  const context = useContext(VaultDndContext)
  if (!context) {
    throw new Error('useVaultDnd must be used within VaultDndProvider')
  }
  return context
}

interface VaultDndProviderProps extends DndCallbacks {
  children: React.ReactNode
}

function DragPreview({ data }: { data: DragData }) {
  const icons = {
    folder: <Folder className="h-5 w-5 text-blue-600" />,
    project: <Music className="h-5 w-5 text-green-600" />,
    track: <FileAudio className="h-5 w-5 text-purple-600" />,
  }

  return (
    <Card className="w-64 opacity-90 shadow-lg border-2 border-primary/50 rounded-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-background border flex items-center justify-center">
            {icons[data.type]}
          </div>
          <CardTitle className="text-sm truncate">{data.name}</CardTitle>
        </div>
      </CardHeader>
    </Card>
  )
}

const dropRules: Record<ItemType, string[]> = {
  folder: ['folder', 'vault'],
  project: ['folder', 'vault', 'project'],
  track: ['project'],
}

export function VaultDndProvider({
  children,
  onMoveFolder,
  onMoveProject,
  onMoveTrack,
  onCombineProjects,
}: VaultDndProviderProps) {
  const [activeDragData, setActiveDragData] = useState<DragData | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const { addToHistory, undo: undoHistory } = useDragHistory()

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 8 },
  })

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  })

  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: (event, { currentCoordinates }) => {
      const delta = 25
      switch (event.code) {
        case 'ArrowRight':
          return { ...currentCoordinates, x: currentCoordinates.x + delta }
        case 'ArrowLeft':
          return { ...currentCoordinates, x: currentCoordinates.x - delta }
        case 'ArrowDown':
          return { ...currentCoordinates, y: currentCoordinates.y + delta }
        case 'ArrowUp':
          return { ...currentCoordinates, y: currentCoordinates.y - delta }
      }
      return undefined
    },
  })

  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor)

  const canDrop = useCallback((dragType: ItemType, dropType: string): boolean => {
    return dropRules[dragType]?.includes(dropType) ?? false
  }, [])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const dragData = active.data.current as DragData
    setActiveDragData(dragData)
    
    if (!selectedItems.has(dragData.id)) {
      setSelectedItems(new Set())
    }
  }, [selectedItems])

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const { active, over } = event
    if (!over || !active.data.current) return
    
    const dragData = active.data.current as DragData
    const dropData = over.data.current as DropData
    
    if (!canDrop(dragData.type, dropData.type)) {
      document.body.style.cursor = 'not-allowed'
    } else {
      document.body.style.cursor = 'grabbing'
    }
  }, [canDrop])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragData(null)
    document.body.style.cursor = ''

    // Early returns - all validation checks grouped together
    if (!over || !active.data.current) return

    const dragData = active.data.current as DragData
    const dropData = over.data.current as DropData

    // Prevent dropping on self
    if (active.id === over.id) return

    // Prevent invalid drop combinations (silently)
    if (!canDrop(dragData.type, dropData.type)) return

    // Prevent project-to-project self-drops (silently)
    if (dragData.type === 'project' && dropData.type === 'project' && dragData.id === dropData.id) return

    // Prevent dropping item back to its current location (silently)
    const sourceLocation = dragData.sourceContainer || 'vault'
    const targetLocation = dropData.id || 'vault'
    if (sourceLocation === targetLocation) return

    const operation: DragOperation = {
      type: dragData.type,
      from: sourceLocation,
      to: targetLocation,
      itemId: dragData.id,
      timestamp: Date.now(),
    }

    try {
      if (dragData.type === 'folder' && onMoveFolder) {
        await onMoveFolder(dragData.id, dropData.id || null, dragData.sourceContainer || null)
        addToHistory(operation)
        toast.success(`Moved "${dragData.name}" to ${dropData.name || 'vault'}`)
      } else if (dragData.type === 'project') {
        if (dropData.type === 'project' && onCombineProjects && dropData.id) {
          await onCombineProjects(dragData.id, dropData.id)
          toast.success(`Combined projects into new folder`)
        } else if (onMoveProject) {
          await onMoveProject(dragData.id, dropData.id || null, dragData.sourceContainer || null)
          addToHistory(operation)
          toast.success(`Moved "${dragData.name}" to ${dropData.name || 'vault'}`)
        }
      } else if (dragData.type === 'track' && onMoveTrack && dropData.id) {
        await onMoveTrack(dragData.id, dropData.id, dragData.sourceContainer!)
        addToHistory(operation)
        toast.success(`Moved track to ${dropData.name}`)
      }
      
      setSelectedItems(new Set())
    } catch (error) {
      console.error('Drag operation failed:', error)
      toast.error('Failed to move item')
    }
  }, [canDrop, onMoveFolder, onMoveProject, onMoveTrack, onCombineProjects, addToHistory])

  const onDragMove = useCallback(async (operation: Omit<DragOperation, 'timestamp'>) => {
    const fullOperation = { ...operation, timestamp: Date.now() }
    
    if (operation.type === 'folder' && onMoveFolder) {
      await onMoveFolder(operation.itemId, operation.to === 'vault' ? null : operation.to, operation.from === 'vault' ? null : operation.from)
    } else if (operation.type === 'project' && onMoveProject) {
      await onMoveProject(operation.itemId, operation.to === 'vault' ? null : operation.to, operation.from === 'vault' ? null : operation.from)
    } else if (operation.type === 'track' && onMoveTrack) {
      await onMoveTrack(operation.itemId, operation.to, operation.from)
    }
    
    addToHistory(fullOperation)
  }, [onMoveFolder, onMoveProject, onMoveTrack, addToHistory])

  const undo = useCallback(async () => {
    await undoHistory(async (operation) => {
      await onDragMove({
        type: operation.type,
        from: operation.from,
        to: operation.to,
        itemId: operation.itemId,
      })
    })
  }, [undoHistory, onDragMove])

  const toggleSelection = useCallback((id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set())
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        undo()
      }
      if (e.key === 'Escape') {
        clearSelection()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, clearSelection])

  const contextValue = useMemo(() => ({
    activeDragData,
    selectedItems,
    toggleSelection,
    clearSelection,
    onDragMove,
    undo,
    canDrop,
  }), [activeDragData, selectedItems, toggleSelection, clearSelection, onDragMove, undo, canDrop])

  return (
    <VaultDndContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
      >
        {children}
        <DragOverlay dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeDragData ? (
            <DragPreview data={activeDragData} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </VaultDndContext.Provider>
  )
}