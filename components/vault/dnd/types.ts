export type ItemType = 'folder' | 'project' | 'track'
export type ContainerType = 'folder' | 'vault' | 'project'

export interface DragData {
  type: ItemType
  id: string
  name: string
  sourceContainer?: string
  metadata?: Record<string, unknown>
}

export interface DropData {
  type: ContainerType
  id?: string
  name?: string
  accepts?: ItemType[]
}

export interface DragOperation {
  type: ItemType
  from: string
  to: string
  itemId: string
  timestamp: number
}

export interface DndCallbacks {
  onMoveFolder?: (folderId: string, destinationFolderId: string | null, sourceFolderId: string | null) => Promise<void>
  onMoveProject?: (projectId: string, destinationFolderId: string | null, sourceFolderId: string | null) => Promise<void>
  onMoveTrack?: (trackId: string, destinationProjectId: string, sourceProjectId: string) => Promise<void>
  onCombineProjects?: (sourceProjectId: string, targetProjectId: string) => Promise<void>
}

export interface DragState {
  isDragging: boolean
  draggedItems: DragData[]
  dropTargets: Set<string>
  history: DragOperation[]
}