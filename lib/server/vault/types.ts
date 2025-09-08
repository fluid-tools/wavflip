import 'server-only';

// ================================
// UNIFIED VAULT DATA TYPES
// ================================

type VaultProject = {
  id: string;
  name: string;
  trackCount: number;
};

export type VaultFolder = {
  id: string;
  name: string;
  parentFolderId: string | null;
  projects: VaultProject[];
  subfolders: VaultFolder[];
  projectCount: number;
  subFolderCount: number;
  level?: number; // Optional for hierarchy display
};

export type VaultData = {
  folders: VaultFolder[];
  rootProjects: VaultProject[];
  path?: BreadcrumbItem[]; // Optional for specific folder views
  stats?: VaultStats;
};

export type BreadcrumbItem = {
  id: string;
  name: string;
  parentFolderId: string | null;
};

export type VaultStats = {
  totalFolders: number;
  totalProjects: number;
  totalTracks: number;
  totalVersions: number;
  totalSize: number;
  totalDuration: number;
};

// ================================
// QUERY OPTIONS
// ================================

export type VaultQueryOptions = {
  // Which data to include
  includeStats?: boolean;
  includePath?: boolean;
  includeHierarchy?: boolean;

  // Filtering options
  excludeFolderId?: string;
  specificFolderId?: string;

  // Display options
  includeLevels?: boolean;
  maxDepth?: number;
};
