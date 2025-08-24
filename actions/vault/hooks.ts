'use client';

import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { useVaultInvalidation } from '@/hooks/data/use-vault';
import {
  createFolderAction,
  deleteFolderAction,
  moveFolderAction,
  renameFolderAction,
} from './folder';
import {
  createProjectAction,
  deleteProjectAction,
  moveProjectAction,
  renameProjectAction,
  createFolderFromProjectsAction,
} from './project';

// Custom hook wrapper that adds success/error handling and invalidation
function useVaultActionWrapper(action: any, successMessage: string) {
  const invalidate = useVaultInvalidation();
  
  const { execute, executeAsync, isPending, result } = useAction(action, {
    onSuccess: () => {
      toast.success(successMessage);
      // Invalidate precise keys to avoid races
      invalidate.invalidateTree();
      invalidate.invalidateProjects();
      invalidate.invalidateFolders();
    },
    onError: ({ error }) => {
      const errorMessage = typeof error.serverError === 'string' 
        ? error.serverError 
        : 'An error occurred';
      toast.error(errorMessage);
    },
  });

  return {
    execute,
    executeAsync,
    isPending,
    result,
  };
}

// Folder action hooks
export function useCreateFolderAction() {
  return useVaultActionWrapper(
    createFolderAction,
    'Folder created successfully'
  );
}

export function useDeleteFolderAction() {
  return useVaultActionWrapper(
    deleteFolderAction,
    'Folder deleted successfully'
  );
}

export function useRenameFolderAction() {
  return useVaultActionWrapper(
    renameFolderAction,
    'Folder renamed successfully'
  );
}

export function useMoveFolderAction() {
  return useVaultActionWrapper(
    moveFolderAction,
    'Folder moved successfully'
  );
}

// Project action hooks
export function useCreateProjectAction() {
  return useVaultActionWrapper(
    createProjectAction,
    'Project created successfully'
  );
}

export function useDeleteProjectAction() {
  return useVaultActionWrapper(
    deleteProjectAction,
    'Project deleted successfully'
  );
}

export function useRenameProjectAction() {
  return useVaultActionWrapper(
    renameProjectAction,
    'Project renamed successfully'
  );
}

export function useMoveProjectAction() {
  return useVaultActionWrapper(
    moveProjectAction,
    'Project moved successfully'
  );
}

export function useCombineProjectsAction() {
  return useVaultActionWrapper(
    createFolderFromProjectsAction,
    'Projects combined successfully'
  );
}