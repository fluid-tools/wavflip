'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { FolderWithProjects, ProjectWithTracks } from '@/db/schema/library'

// ================================
// QUERY KEYS
// ================================

export const libraryKeys = {
  all: ['library'] as const,
  sidebar: () => [...libraryKeys.all, 'sidebar'] as const,
  folders: () => [...libraryKeys.all, 'folders'] as const,
  folder: (id: string) => [...libraryKeys.folders(), id] as const,
  projects: () => [...libraryKeys.all, 'projects'] as const,
  project: (id: string) => [...libraryKeys.projects(), id] as const,
  vaultProjects: () => [...libraryKeys.all, 'vault-projects'] as const,
  stats: () => [...libraryKeys.all, 'stats'] as const,
}

// ================================
// SIDEBAR HOOK
// ================================

interface SidebarFolder {
  id: string
  name: string
  parentFolderId: string | null
  projects: Array<{
    id: string
    name: string
    trackCount: number
  }>
  subfolders: SidebarFolder[]
  projectCount: number
  subFolderCount: number
}

interface LibrarySidebarData {
  folders: SidebarFolder[]
  rootProjects: Array<{
    id: string
    name: string
    trackCount: number
  }>
}

export function useLibrarySidebar() {
  return useQuery({
    queryKey: libraryKeys.sidebar(),
    queryFn: async (): Promise<LibrarySidebarData> => {
      const response = await fetch('/api/library/sidebar')
      if (!response.ok) throw new Error('Failed to fetch library sidebar')
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// ================================
// FOLDER HOOKS
// ================================

export function useFolder(folderId: string, initialData?: FolderWithProjects) {
  const queryKey = libraryKeys.folder(folderId)
  
  return useQuery({
    queryKey,
    queryFn: async (): Promise<FolderWithProjects> => {
      const response = await fetch(`/api/folders/${folderId}`)
      if (!response.ok) throw new Error('Failed to fetch folder')
      return response.json()
    },
    initialData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useRootFolders() {
  return useQuery({
    queryKey: libraryKeys.folders(),
    queryFn: async (): Promise<FolderWithProjects[]> => {
      const response = await fetch('/api/folders')
      if (!response.ok) throw new Error('Failed to fetch folders')
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

// ================================
// PROJECT HOOKS
// ================================

export function useProject(projectId: string, initialData?: ProjectWithTracks) {
  const queryKey = libraryKeys.project(projectId)
  
  return useQuery({
    queryKey,
    queryFn: async (): Promise<ProjectWithTracks> => {
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) throw new Error('Failed to fetch project')
      return response.json()
    },
    initialData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useVaultProjects() {
  return useQuery({
    queryKey: libraryKeys.vaultProjects(),
    queryFn: async (): Promise<ProjectWithTracks[]> => {
      const response = await fetch('/api/library/sidebar')
      if (!response.ok) throw new Error('Failed to fetch library data')
      const data = await response.json()
      return data.rootProjects || []
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

// ================================
// QUERY INVALIDATION HELPER
// ================================

export function useLibraryInvalidation() {
  const queryClient = useQueryClient()
  
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: libraryKeys.all }),
    invalidateSidebar: () => queryClient.invalidateQueries({ queryKey: libraryKeys.sidebar() }),
    invalidateFolders: () => queryClient.invalidateQueries({ queryKey: libraryKeys.folders() }),
    invalidateFolder: (id: string) => queryClient.invalidateQueries({ queryKey: libraryKeys.folder(id) }),
    invalidateProjects: () => queryClient.invalidateQueries({ queryKey: libraryKeys.projects() }),
    invalidateProject: (id: string) => queryClient.invalidateQueries({ queryKey: libraryKeys.project(id) }),
    invalidateVaultProjects: () => queryClient.invalidateQueries({ queryKey: libraryKeys.vaultProjects() }),
    invalidateStats: () => queryClient.invalidateQueries({ queryKey: libraryKeys.stats() }),
  }
}

// ================================
// LIBRARY STATS HOOK
// ================================

export function useLibraryStats() {
  return useQuery({
    queryKey: libraryKeys.stats(),
    queryFn: async () => {
      const response = await fetch('/api/library/sidebar?stats=true')
      if (!response.ok) throw new Error('Failed to fetch library stats')
      const data = await response.json()
      return data.stats
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  })
} 