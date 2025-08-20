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
  createFolderFromProjectsAction,
  createProjectAction,
  deleteProjectAction,
  moveProjectAction,
  renameProjectAction,
} from './project';

type UseVaultActionOptions = {
  successMessage?: string;
  onSuccess?: (result: unknown) => void;
  onError?: (error: string) => void;
};

function createVaultHook(action: any, defaultSuccessMessage: string) {
  return (options: Omit<UseVaultActionOptions, 'successMessage'> = {}) => {
    const invalidate = useVaultInvalidation();
    const {
      successMessage = defaultSuccessMessage,
      onSuccess,
      onError,
    } = {
      successMessage: defaultSuccessMessage,
      ...options,
    };

    return useAction(action, {
      onSuccess: (result) => {
        // Show success message
        if (successMessage) {
          toast.success(successMessage);
        }

        // Invalidate all vault-related queries
        // React Query is smart enough to only refetch what's actually being used
        invalidate.invalidateAll();

        // Call custom success handler
        onSuccess?.(result);
      },
      onError: (error) => {
        const errorMessage =
          (error.error?.serverError as string) || 'An error occurred';
        toast.error(errorMessage);
        onError?.(errorMessage);
      },
    });
  };
}

// Folder hooks
export const useCreateFolderAction = createVaultHook(
  createFolderAction,
  'Folder created successfully'
);

export const useDeleteFolderAction = createVaultHook(
  deleteFolderAction,
  'Folder deleted successfully'
);

export const useRenameFolderAction = createVaultHook(
  renameFolderAction,
  'Folder renamed successfully'
);

export const useMoveFolderAction = createVaultHook(
  moveFolderAction,
  'Folder moved successfully'
);

// Project hooks
export const useCreateProjectAction = createVaultHook(
  createProjectAction,
  'Project created successfully'
);

export const useDeleteProjectAction = createVaultHook(
  deleteProjectAction,
  'Project deleted successfully'
);

export const useRenameProjectAction = createVaultHook(
  renameProjectAction,
  'Project renamed successfully'
);

export const useMoveProjectAction = createVaultHook(
  moveProjectAction,
  'Project moved successfully'
);

export const useCombineProjectsAction = createVaultHook(
  createFolderFromProjectsAction,
  'Projects combined successfully'
);
