import 'server-only'

import type { 
  Folder, NewFolder, 
  Project, NewProject,
  Track, NewTrack,
  TrackVersion, NewTrackVersion,
  FolderWithProjects,
  ProjectWithTracks
} from '@/db/schema/vault'

// Re-export schema types for convenience
export type { 
  Folder, NewFolder,
  Project, NewProject, 
  Track, NewTrack,
  TrackVersion, NewTrackVersion,
  FolderWithProjects,
  ProjectWithTracks
}

// ================================
// UNIFIED LIBRARY DATA TYPES
// ================================

export interface LibraryProject {
  id: string
  name: string
  trackCount: number
}

export interface LibraryFolder {
  id: string
  name: string
  parentFolderId: string | null
  projects: LibraryProject[]
  subfolders: LibraryFolder[]
  projectCount: number
  subFolderCount: number
  level?: number // Optional for hierarchy display
}

export interface LibraryData {
  folders: LibraryFolder[]
  rootProjects: LibraryProject[]
  path?: BreadcrumbItem[] // Optional for specific folder views
  stats?: LibraryStats
}

export interface BreadcrumbItem {
  id: string
  name: string
  parentFolderId: string | null
}

export interface LibraryStats {
  totalFolders: number
  totalProjects: number
  totalTracks: number
  totalVersions: number
  totalSize: number
  totalDuration: number
}

// ================================
// QUERY OPTIONS
// ================================

export interface LibraryQueryOptions {
  // Which data to include
  includeStats?: boolean
  includePath?: boolean
  includeHierarchy?: boolean
  
  // Filtering options
  excludeFolderId?: string
  specificFolderId?: string
  
  // Display options
  includeLevels?: boolean
  maxDepth?: number
} 