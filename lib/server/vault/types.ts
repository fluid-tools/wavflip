import 'server-only'

// ================================
// UNIFIED VAULT DATA TYPES
// ================================

interface VaultProject {
  id: string
  name: string
  trackCount: number
}

export interface VaultFolder {
  id: string
  name: string
  parentFolderId: string | null
  projects: VaultProject[]
  subfolders: VaultFolder[]
  projectCount: number
  subFolderCount: number
  level?: number // Optional for hierarchy display
}

export interface VaultData {
  folders: VaultFolder[]
  rootProjects: VaultProject[]
  path?: BreadcrumbItem[] // Optional for specific folder views
  stats?: VaultStats
}

export interface BreadcrumbItem {
  id: string
  name: string
  parentFolderId: string | null
}

export interface VaultStats {
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

export interface VaultQueryOptions {
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


