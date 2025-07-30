import 'server-only'

// Re-export types
export * from './types'

// Re-export data functions
export * from './data'

// Export unified data functions  
export {
  getVaultData,
  getSidebarData,
  getHierarchicalFolders,
  getVaultStats
} from './data'

// Export all functions from CRUD module (includes both data fetching and mutations)
export {
  // Data fetching
  getUserFolders,
  getAllUserFolders,
  getVaultProjects,
  getProjectWithTracks,
  getFolderWithContents,
  
  // CRUD operations
  createFolder,
  deleteFolder,
  renameFolder,
  moveFolder,
  createProject,
  deleteProject,
  renameProject,
  moveProject,
  createTrack,
  deleteTrack,
  renameTrack,
  moveTrack,
  createTrackVersion,
  setActiveVersion,
  handleDuplicateFolderName,
  handleDuplicateProjectName
} from './crud' 