'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { FolderWithProjects, ProjectWithTracks } from '@/db/schema/vault'
import { vaultKeys } from './keys'

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

export function useFolder(folderId: string) {
  const queryKey = vaultKeys.folder(folderId)
  
  return useQuery({
    queryKey,
    queryFn: async (): Promise<FolderWithProjects> => {
      const response = await fetch(`/api/folders/${folderId}`)
      if (!response.ok) throw new Error('Failed to fetch folder')
      return response.json()
    },
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

export function useVaultProjects() {
  return useQuery({
    queryKey: vaultKeys.vaultProjects(),
    queryFn: async (): Promise<ProjectWithTracks[]> => {
      const response = await fetch('/api/vault/projects')
      if (!response.ok) throw new Error('Failed to fetch vault projects')
      return response.json()
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
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: vaultKeys.base }),
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

// ================================
// FOLDER PATH HOOK
// ================================

interface FolderPathItem {
  id: string
  name: string
  parentFolderId: string | null
}

export function useFolderPath(folderId: string | null) {
  return useQuery({
    queryKey: [...vaultKeys.folder(folderId!), 'path'],
    queryFn: async (): Promise<{ path: FolderPathItem[] } | null> => {
      if (!folderId) return null
      const response = await fetch(`/api/folders/${folderId}/path`)
      if (!response.ok) throw new Error('Failed to fetch folder path')
      return response.json()
    },
    enabled: !!folderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// ================================
// STORAGE HOOK
// ================================

interface StorageInfo {
  usage: number
  quota: number
  usagePercentage: number
  usageMB: number
  quotaMB: number
  usageDetails?: {
    indexedDB?: number
    caches?: number
    serviceWorker?: number
  }
}

export function useStorageEstimate() {
  return useQuery({
    queryKey: vaultKeys.storage(),
    queryFn: async (): Promise<StorageInfo | null> => {
      if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
        return null
      }
      
      try {
        const estimate = await navigator.storage.estimate()
        const usage = estimate.usage || 0
        const quota = estimate.quota || 0
        
        return {
          usage,
          quota,
          usagePercentage: quota > 0 ? (usage / quota) * 100 : 0,
          usageMB: usage / (1024 * 1024),
          quotaMB: quota / (1024 * 1024),
          usageDetails: 'usageDetails' in estimate 
            ? (estimate as StorageEstimate & { usageDetails?: Record<string, number> }).usageDetails 
            : undefined
        }
      } catch (error) {
        console.error('Failed to estimate storage:', error)
        return null
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
    refetchOnWindowFocus: true,
  })
}
