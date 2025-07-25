'use client'

import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCenter,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useState, createContext, useContext } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Folder, Music, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'

// Types for drag and drop operations
export type DragData = {
  type: 'folder' | 'project' | 'track'
  id: string
  name: string
  sourceContainer?: string // folderId or 'vault' for source location
}

export type DropData = {
  type: 'folder' | 'vault'
  id?: string // folderId or undefined for vault
}

interface LibraryDndContextType {
  activeDragData: DragData | null
  onDragMove: (data: { type: 'folder' | 'project' | 'track'; from: string; to: string; itemId: string }) => Promise<void>
}

const LibraryDndContext = createContext<LibraryDndContextType | null>(null)

export function useLibraryDnd() {
  const context = useContext(LibraryDndContext)
  if (!context) {
    throw new Error('useLibraryDnd must be used within LibraryDndProvider')
  }
  return context
}

interface LibraryDndProviderProps {
  children: React.ReactNode
  onMoveFolder?: (folderId: string, parentFolderId: string | null, sourceParentFolderId: string | null) => Promise<void>
  onMoveProject?: (projectId: string, folderId: string | null, sourceFolderId: string | null) => Promise<void>
  onMoveTrack?: (trackId: string, projectId: string, sourceProjectId: string) => Promise<void>
}

export function LibraryDndProvider({
  children,
  onMoveFolder,
  onMoveProject,
  onMoveTrack,
}: LibraryDndProviderProps) {
  const [activeDragData, setActiveDragData] = useState<DragData | null>(null)

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 8,
    },
  })

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200,
      tolerance: 5,
    },
  })

  const sensors = useSensors(mouseSensor, touchSensor)

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveDragData(active.data.current as DragData)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragData(null)

    if (!over || !active.data.current) return

    const dragData = active.data.current as DragData
    const dropData = over.data.current as DropData

    // Prevent dropping on self or invalid operations
    if (active.id === over.id) return

    try {
      // Handle folder drops
      if (dragData.type === 'folder' && dropData.type === 'folder') {
        if (onMoveFolder) {
          await onMoveFolder(dragData.id, dropData.id || null, dragData.sourceContainer || null)
          toast.success(`Moved folder "${dragData.name}"`)
        }
      }
      // Handle vault drops (moving to root)
      else if (dragData.type === 'folder' && dropData.type === 'vault') {
        if (onMoveFolder) {
          await onMoveFolder(dragData.id, null, dragData.sourceContainer || null)
          toast.success(`Moved folder "${dragData.name}" to vault`)
        }
      }
      // Handle project drops into folders
      else if (dragData.type === 'project' && dropData.type === 'folder') {
        if (onMoveProject) {
          await onMoveProject(dragData.id, dropData.id || null, dragData.sourceContainer || null)
          toast.success(`Moved project "${dragData.name}"`)
        }
      }
      // Handle project drops into vault
      else if (dragData.type === 'project' && dropData.type === 'vault') {
        if (onMoveProject) {
          await onMoveProject(dragData.id, null, dragData.sourceContainer || null)
          toast.success(`Moved project "${dragData.name}" to vault`)
        }
      }
    } catch (error) {
      console.error('Drag and drop error:', error)
      toast.error('Failed to move item')
    }
  }

  const onDragMove = async (data: { type: 'folder' | 'project' | 'track'; from: string; to: string; itemId: string }) => {
    try {
      if (data.type === 'folder' && onMoveFolder) {
        await onMoveFolder(data.itemId, data.to === 'vault' ? null : data.to, data.from === 'vault' ? null : data.from)
      } else if (data.type === 'project' && onMoveProject) {
        await onMoveProject(data.itemId, data.to === 'vault' ? null : data.to, data.from === 'vault' ? null : data.from)
      } else if (data.type === 'track' && onMoveTrack) {
        await onMoveTrack(data.itemId, data.to, data.from)
      }
    } catch (error) {
      console.error('Move operation failed:', error)
      throw error
    }
  }

  return (
    <LibraryDndContext.Provider value={{ activeDragData, onDragMove }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {children}
        <DragOverlay>
          {activeDragData ? (
            <DragPreview data={activeDragData} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </LibraryDndContext.Provider>
  )
}

function DragPreview({ data }: { data: DragData }) {
  const getIcon = () => {
    switch (data.type) {
      case 'folder':
        return <Folder className="h-5 w-5 text-blue-600" />
      case 'project':
        return <Music className="h-5 w-5 text-green-600" />
      case 'track':
        return <FolderOpen className="h-5 w-5 text-purple-600" />
      default:
        return null
    }
  }

  return (
    <Card className="w-64 opacity-90 shadow-lg border-2 border-dashed border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-background border flex items-center justify-center">
            {getIcon()}
          </div>
          <CardTitle className="text-sm truncate">{data.name}</CardTitle>
        </div>
      </CardHeader>
    </Card>
  )
} 