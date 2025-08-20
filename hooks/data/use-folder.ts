'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FolderGetResponseSchema,
  FoldersListResponseSchema,
} from '@/lib/contracts/api/folders';
import type { FolderWithProjects } from '@/lib/contracts/folder';
import type { VaultData } from '@/lib/contracts/vault';
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
  const queryClient = useQueryClient();
  const [treeEntry] = queryClient.getQueriesData<VaultData>({
    queryKey: vaultKeys.tree(),
  });
  const treeData = treeEntry?.[1];
  const fromTree = Array.isArray(treeData?.folders)
    ? (treeData!.folders as unknown as FolderWithProjects[])
    : undefined;

  return useQuery({
    queryKey: vaultKeys.folders(),
    queryFn: async (): Promise<FolderWithProjects[]> => {
      const response = await fetch('/api/folders');
      if (!response.ok) throw new Error('Failed to fetch folders');
      const json = await response.json();
      return FoldersListResponseSchema.parse(json);
    },
    placeholderData: fromTree,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// ================================
// FOLDER PATH HOOK
// ================================

interface FolderPathItem {
  id: string;
  name: string;
  parentFolderId: string | null;
}

export function useFolderPath(folderId: string | null) {
  return useQuery({
    queryKey: [...vaultKeys.folder(folderId!), 'path'],
    queryFn: async (): Promise<{ path: FolderPathItem[] } | null> => {
      if (!folderId) return null;
      const response = await fetch(`/api/folders/${folderId}/path`);
      if (!response.ok) throw new Error('Failed to fetch folder path');
      return response.json();
    },
    enabled: !!folderId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
