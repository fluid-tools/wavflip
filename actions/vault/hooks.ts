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

// Folder action hooks
export function useCreateFolderAction() {
  const invalidate = useVaultInvalidation();
  return useAction(createFolderAction, {
    onSuccess: () => {
      toast.success('Folder created successfully');
      invalidate.invalidateTree();
      invalidate.invalidateProjects();
      invalidate.invalidateFolders();
    },
    onError: ({ error }) => {
      const message =
        typeof error.serverError === 'string'
          ? error.serverError
          : 'An error occurred';
      toast.error(message);
    },
  });
}

export function useDeleteFolderAction() {
  const invalidate = useVaultInvalidation();
  return useAction(deleteFolderAction, {
    onSuccess: () => {
      toast.success('Folder deleted successfully');
      invalidate.invalidateTree();
      invalidate.invalidateProjects();
      invalidate.invalidateFolders();
    },
    onError: ({ error }) => {
      const message =
        typeof error.serverError === 'string'
          ? error.serverError
          : 'An error occurred';
      toast.error(message);
    },
  });
}

export function useRenameFolderAction() {
  const invalidate = useVaultInvalidation();
  return useAction(renameFolderAction, {
    onSuccess: () => {
      toast.success('Folder renamed successfully');
      invalidate.invalidateTree();
      invalidate.invalidateProjects();
      invalidate.invalidateFolders();
    },
    onError: ({ error }) => {
      const message =
        typeof error.serverError === 'string'
          ? error.serverError
          : 'An error occurred';
      toast.error(message);
    },
  });
}

export function useMoveFolderAction() {
  const invalidate = useVaultInvalidation();
  return useAction(moveFolderAction, {
    onSuccess: () => {
      toast.success('Folder moved successfully');
      invalidate.invalidateTree();
      invalidate.invalidateProjects();
      invalidate.invalidateFolders();
    },
    onError: ({ error }) => {
      const message =
        typeof error.serverError === 'string'
          ? error.serverError
          : 'An error occurred';
      toast.error(message);
    },
  });
}

// Project action hooks
export function useCreateProjectAction() {
  const invalidate = useVaultInvalidation();
  return useAction(createProjectAction, {
    onSuccess: () => {
      toast.success('Project created successfully');
      invalidate.invalidateTree();
      invalidate.invalidateProjects();
      invalidate.invalidateFolders();
    },
    onError: ({ error }) => {
      const message =
        typeof error.serverError === 'string'
          ? error.serverError
          : 'An error occurred';
      toast.error(message);
    },
  });
}

export function useDeleteProjectAction() {
  const invalidate = useVaultInvalidation();
  return useAction(deleteProjectAction, {
    onSuccess: () => {
      toast.success('Project deleted successfully');
      invalidate.invalidateTree();
      invalidate.invalidateProjects();
      invalidate.invalidateFolders();
    },
    onError: ({ error }) => {
      const message =
        typeof error.serverError === 'string'
          ? error.serverError
          : 'An error occurred';
      toast.error(message);
    },
  });
}

export function useRenameProjectAction() {
  const invalidate = useVaultInvalidation();
  return useAction(renameProjectAction, {
    onSuccess: () => {
      toast.success('Project renamed successfully');
      invalidate.invalidateTree();
      invalidate.invalidateProjects();
      invalidate.invalidateFolders();
    },
    onError: ({ error }) => {
      const message =
        typeof error.serverError === 'string'
          ? error.serverError
          : 'An error occurred';
      toast.error(message);
    },
  });
}

export function useMoveProjectAction() {
  const invalidate = useVaultInvalidation();
  return useAction(moveProjectAction, {
    onSuccess: () => {
      toast.success('Project moved successfully');
      invalidate.invalidateTree();
      invalidate.invalidateProjects();
      invalidate.invalidateFolders();
    },
    onError: ({ error }) => {
      const message =
        typeof error.serverError === 'string'
          ? error.serverError
          : 'An error occurred';
      toast.error(message);
    },
  });
}

export function useCombineProjectsAction() {
  const invalidate = useVaultInvalidation();
  return useAction(createFolderFromProjectsAction, {
    onSuccess: () => {
      toast.success('Projects combined successfully');
      invalidate.invalidateTree();
      invalidate.invalidateProjects();
      invalidate.invalidateFolders();
    },
    onError: ({ error }) => {
      const message =
        typeof error.serverError === 'string'
          ? error.serverError
          : 'An error occurred';
      toast.error(message);
    },
  });
}
