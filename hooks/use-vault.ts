'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { FolderWithProjects, ProjectWithTracks } from '@/db/schema/vault'

// ================================
// QUERY KEYS
// ================================

export const vaultKeys = {
  all: ['vault'] as const,
  sidebar: () => [...vaultKeys.all, 'sidebar'] as const,
  folders: () => [...vaultKeys.all, 'folders'] as const,
  folder: (id: string) => [...vaultKeys.folders(), id] as const,
  projects: () => [...vaultKeys.all, 'projects'] as const,
  project: (id: string) => [...vaultKeys.projects(), id] as const,
  vaultProjects: () => [...vaultKeys.all, 'vault-projects'] as const,
  stats: () => [...vaultKeys.all, 'stats'] as const,
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

interface VaultSidebarData {
  folders: SidebarFolder[]
  rootProjects: Array<{
    id: string
    name: string
    trackCount: number
  }>
}

export function useVaultSidebar() {
  return useQuery({
    queryKey: vaultKeys.sidebar(),
    queryFn: async (): Promise<VaultSidebarData> => {
      const response = await fetch('/api/vault/sidebar')
      if (!response.ok) throw new Error('Failed to fetch vault sidebar')
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
  const queryKey = vaultKeys.folder(folderId)
  
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
    queryKey: vaultKeys.folders(),
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
  const queryKey = vaultKeys.project(projectId)
  
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
    queryKey: vaultKeys.vaultProjects(),
    queryFn: async (): Promise<ProjectWithTracks[]> => {
      const response = await fetch('/api/vault/sidebar')
      if (!response.ok) throw new Error('Failed to fetch vault data')
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

export function useVaultInvalidation() {
  const queryClient = useQueryClient()
  
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: vaultKeys.all }),
    invalidateSidebar: () => queryClient.invalidateQueries({ queryKey: vaultKeys.sidebar() }),
    invalidateFolders: () => queryClient.invalidateQueries({ queryKey: vaultKeys.folders() }),
    invalidateFolder: (id: string) => queryClient.invalidateQueries({ queryKey: vaultKeys.folder(id) }),
    invalidateProjects: () => queryClient.invalidateQueries({ queryKey: vaultKeys.projects() }),
    invalidateProject: (id: string) => queryClient.invalidateQueries({ queryKey: vaultKeys.project(id) }),
    invalidateVaultProjects: () => queryClient.invalidateQueries({ queryKey: vaultKeys.vaultProjects() }),
    invalidateStats: () => queryClient.invalidateQueries({ queryKey: vaultKeys.stats() }),
  }
}

// ================================
// VAULT STATS HOOK
// ================================

export function useVaultStats() {
  return useQuery({
    queryKey: vaultKeys.stats(),
    queryFn: async () => {
      const response = await fetch('/api/vault/sidebar?stats=true')
      if (!response.ok) throw new Error('Failed to fetch vault stats')
      const data = await response.json()
      return data.stats
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  })
} 