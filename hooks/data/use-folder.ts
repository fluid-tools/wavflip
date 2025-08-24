'use client';

import { useQuery } from '@tanstack/react-query';
import {
  FolderGetResponseSchema,
  FoldersListResponseSchema,
} from '@/lib/contracts/api/folders';
import type { FolderWithProjects } from '@/lib/contracts/folder';
import { useVaultTree } from '@/hooks/data/use-vault';
import { BreadcrumbItemSchema } from '@/lib/contracts/vault';
import type { BreadcrumbItem, VaultFolder } from '@/lib/contracts/vault';
import { z } from 'zod';
import { vaultKeys } from './keys';

// ================================
// FOLDER HOOKS
// ================================

export function useFolder(folderId: string) {
  const queryKey = vaultKeys.folder(folderId);

  return useQuery({
    queryKey,
    queryFn: async (): Promise<FolderWithProjects> => {
      const response = await fetch(`/api/folders/${folderId}`);
      if (!response.ok) throw new Error('Failed to fetch folder');
      const json = await response.json();
      return FolderGetResponseSchema.parse(json);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useRootFolders() {
  return useQuery({
    queryKey: vaultKeys.folders(),
    queryFn: async (): Promise<FolderWithProjects[]> => {
      const response = await fetch('/api/folders');
      if (!response.ok) throw new Error('Failed to fetch folders');
      const json = await response.json();
      return FoldersListResponseSchema.parse(json);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// ================================
// FOLDER PATH HOOK
// ================================

export function useFolderPath(folderId: string | null) {
  const { data: vaultData } = useVaultTree({ levels: false });

  return useQuery({
    // Tie invalidation to the tree cache so this re-computes when tree is invalidated
    queryKey: [...vaultKeys.tree(), 'path', folderId],
    queryFn: async (): Promise<{ path: BreadcrumbItem[] } | null> => {
      if (!folderId || !vaultData) return null;

      // DFS to find path to target folder
      const findPath = (
        folders: VaultFolder[],
        targetId: string,
        acc: BreadcrumbItem[] = []
      ): BreadcrumbItem[] | null => {
        for (const f of folders) {
          const current: BreadcrumbItem = {
            id: f.id,
            name: f.name,
            parentFolderId: f.parentFolderId,
          };
          if (f.id === targetId) return [...acc, current];
          if (f.subfolders && f.subfolders.length > 0) {
            const found = findPath(f.subfolders, targetId, [...acc, current]);
            if (found) return found;
          }
        }
        return null;
      };

      const path = findPath(vaultData.folders, folderId) ?? [];
      // Validate derived structure for consistency
      const validated = z.array(BreadcrumbItemSchema).parse(path);
      return { path: validated };
    },
    enabled: !!folderId && !!vaultData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
