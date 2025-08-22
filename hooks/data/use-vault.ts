'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type VaultData, VaultDataSchema } from '@/lib/contracts/vault';
import { vaultKeys } from './keys';

// ================================
// TREE HOOKS (VAULT)
// ================================

export function useVaultTree(opts?: {
  levels?: boolean;
  excludeId?: string;
  stats?: boolean;
}) {
  const { levels = false, excludeId, stats = false } = opts ?? {};
  return useQuery({
    queryKey: [
      ...vaultKeys.tree(),
      { levels, excludeId: excludeId ?? null, stats },
    ],
    queryFn: async (): Promise<VaultData> => {
      const url = new URL('/api/vault/tree', process.env.NEXT_PUBLIC_BASE_URL);
      url.searchParams.set('levels', String(!!levels));
      if (excludeId) url.searchParams.set('exclude', excludeId);
      if (stats) url.searchParams.set('stats', 'true');
      const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch vault tree');
      const json = await response.json();
      return VaultDataSchema.parse(json);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// ================================
// QUERY INVALIDATION HELPER
// ================================

export function useVaultInvalidation() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: vaultKeys.base }),
    invalidateTree: () =>
      queryClient.invalidateQueries({ queryKey: vaultKeys.tree() }),
    invalidateFolders: () =>
      queryClient.invalidateQueries({ queryKey: vaultKeys.folders() }),
    invalidateFolder: (id: string) =>
      queryClient.invalidateQueries({ queryKey: vaultKeys.folder(id) }),
    invalidateProjects: () =>
      queryClient.invalidateQueries({ queryKey: vaultKeys.projects() }),
    invalidateProject: (id: string) =>
      queryClient.invalidateQueries({ queryKey: vaultKeys.project(id) }),
    invalidateStats: () =>
      queryClient.invalidateQueries({ queryKey: vaultKeys.stats() }),
  };
}

// ================================
// STORAGE HOOK
// ================================

interface StorageInfo {
  usage: number;
  quota: number;
  usagePercentage: number;
  usageMB: number;
  quotaMB: number;
  usageDetails?: {
    indexedDB?: number;
    caches?: number;
    serviceWorker?: number;
  };
}

export function useStorageEstimate() {
  return useQuery({
    queryKey: vaultKeys.storage(),
    queryFn: async (): Promise<StorageInfo | null> => {
      if (!('storage' in navigator && 'estimate' in navigator.storage)) {
        return null;
      }

      try {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;

        return {
          usage,
          quota,
          usagePercentage: quota > 0 ? (usage / quota) * 100 : 0,
          usageMB: usage / (1024 * 1024),
          quotaMB: quota / (1024 * 1024),
          usageDetails:
            'usageDetails' in estimate
              ? (
                  estimate as StorageEstimate & {
                    usageDetails?: Record<string, number>;
                  }
                ).usageDetails
              : undefined,
        };
      } catch (error) {
        console.error('Failed to estimate storage:', error);
        return null;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
    refetchOnWindowFocus: true,
  });
}
