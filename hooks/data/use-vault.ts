'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { FolderWithProjects } from '@/lib/contracts/folder'
import type { ProjectWithTracks } from '@/lib/contracts/project'
import { VaultDataSchema, type VaultData } from '@/lib/contracts/vault'
import { ProjectsListResponseSchema } from '@/lib/contracts/api/projects'
import { FoldersListResponseSchema } from '@/lib/contracts/api/folders'
import { vaultKeys } from './keys'

// ================================
// TREE HOOKS (VAULT)
// ================================


export function useVaultTree(opts?: { levels?: boolean; excludeId?: string; stats?: boolean }) {
  const { levels = false, excludeId, stats = false } = opts ?? {}
  return useQuery({
    queryKey: ['vault', 'tree', { levels, excludeId: excludeId ?? null, stats }],
    queryFn: async (): Promise<VaultData> => {
      const url = new URL('/api/vault/tree', process.env.NEXT_PUBLIC_BASE_URL)
      url.searchParams.set('levels', String(!!levels))
      if (excludeId) url.searchParams.set('exclude', excludeId)
      if (stats) url.searchParams.set('stats', 'true')
      const response = await fetch(url.toString(), {
        headers: { 'Accept': 'application/json' },
      })
      if (!response.ok) throw new Error('Failed to fetch vault tree')
      const json = await response.json()
      return VaultDataSchema.parse(json)
    },
    staleTime: 5 * 60 * 1000,
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
      // TODO: introduce a dedicated contract schema for folder GET by id
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useRootFolders() {
  // Read tree cache directly to avoid using any types
  const queryClient = useQueryClient()
  const treeData = queryClient.getQueryData<VaultData>(vaultKeys.tree())
  if (treeData && treeData.folders.length > 0) { console.log('treeData cache hit') }
  const fromTree = Array.isArray(treeData?.folders)
    ? treeData!.folders.map((f) => ({ ...f, tracks: [] }))
    : undefined

  return useQuery({
    queryKey: vaultKeys.folders(),
    queryFn: async (): Promise<FolderWithProjects[]> => {
      const response = await fetch('/api/folders')
      if (!response.ok) throw new Error('Failed to fetch folders')
      const json = await response.json()
      return FoldersListResponseSchema.parse(json)
    },
    placeholderData: fromTree as unknown as FolderWithProjects[] | undefined,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

// ================================
// PROJECT HOOKS
// ================================

export function useVaultProjects() {
  const queryClient = useQueryClient()
  const treeData = queryClient.getQueryData<VaultData>(vaultKeys.tree())
  const fromTree = Array.isArray(treeData?.rootProjects)
    ? treeData!.rootProjects.map((p) => ({ ...p, tracks: [] }))
    : undefined

  return useQuery({
    queryKey: vaultKeys.vaultProjects(),
    queryFn: async (): Promise<ProjectWithTracks[]> => {
      const response = await fetch('/api/projects')
      if (!response.ok) throw new Error('Failed to fetch vault projects')
      const json = await response.json()
      return ProjectsListResponseSchema.parse(json)
    },
    placeholderData: fromTree as unknown as ProjectWithTracks[] | undefined,
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
    invalidateTree: () => queryClient.invalidateQueries({ queryKey: vaultKeys.tree() }),
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

// export function useVaultStats() {
//   return useQuery({
//     queryKey: vaultKeys.stats(),
//     queryFn: async () => {
//       const url = new URL('/api/vault/stats', process.env.NEXT_PUBLIC_BASE_URL)
//       url.searchParams.set('stats', 'true')
//       const response = await fetch(url.toString())
//       if (!response.ok) throw new Error('Failed to fetch vault stats')
//       const data = await response.json()
//       return data.stats
//     },
//     staleTime: 10 * 60 * 1000, // 10 minutes
//     refetchOnWindowFocus: false,
//   })
// }

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
