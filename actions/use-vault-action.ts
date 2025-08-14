'use client'

import { useActionState } from 'react'
import { toast } from 'sonner'
import { useVaultInvalidation } from '@/hooks/data/use-vault'

type BaseActionState = {
  success: boolean
  error: string | null
}

interface UseVaultActionOptions {
  successMessage?: string
  onSuccess?: (result: any) => void
}

export function useVaultAction(
  action: (prevState: any, formData: FormData) => Promise<any>,
  initialState: BaseActionState,
  options: UseVaultActionOptions = {}
) {
  const invalidate = useVaultInvalidation()
  const { successMessage, onSuccess } = options

  const wrappedAction = async (prevState: any, payload: FormData) => {
    const result = await action(prevState, payload)
    
    if (result.success) {
      // Show success message
      if (successMessage) {
        toast.success(successMessage)
      }
      
      // Simple: just invalidate everything vault-related
      // React Query is smart enough to only refetch what's actually being used
      invalidate.invalidateAll()
      
      // Call custom success handler
      onSuccess?.(result)
    } else if (result.error) {
      toast.error(result.error)
    }
    
    return result
  }
  
  return useActionState(wrappedAction, initialState)
}

// Specific hooks for common operations
export function useCreateFolderAction(options: Omit<UseVaultActionOptions, 'successMessage'> = {}) {
  const { createFolderAction } = require('@/actions/vault/folder')
  
  return useVaultAction(
    createFolderAction,
    { success: false, error: null },
    {
      successMessage: 'Folder created successfully',
      ...options
    }
  )
}

export function useCreateProjectAction(options: Omit<UseVaultActionOptions, 'successMessage'> = {}) {
  const { createProjectAction } = require('@/actions/vault/project')
  
  return useVaultAction(
    createProjectAction,
    { success: false, error: null },
    {
      successMessage: 'Project created successfully',
      ...options
    }
  )
}

export function useDeleteFolderAction(options: Omit<UseVaultActionOptions, 'successMessage'> = {}) {
  const { deleteFolderAction } = require('@/actions/vault/folder')
  
  return useVaultAction(
    deleteFolderAction,
    { success: false, error: null },
    {
      successMessage: 'Folder deleted successfully',
      ...options
    }
  )
}

export function useDeleteProjectAction(options: Omit<UseVaultActionOptions, 'successMessage'> = {}) {
  const { deleteProjectAction } = require('@/actions/vault/project')
  
  return useVaultAction(
    deleteProjectAction,
    { success: false, error: null },
    {
      successMessage: 'Project deleted successfully',
      ...options
    }
  )
}

export function useRenameFolderAction(options: Omit<UseVaultActionOptions, 'successMessage'> = {}) {
  const { renameFolderAction } = require('@/actions/vault/folder')
  
  return useVaultAction(
    renameFolderAction,
    { success: false, error: null },
    {
      successMessage: 'Folder renamed successfully',
      ...options
    }
  )
}

export function useRenameProjectAction(options: Omit<UseVaultActionOptions, 'successMessage'> = {}) {
  const { renameProjectAction } = require('@/actions/vault/project')
  
  return useVaultAction(
    renameProjectAction,
    { success: false, error: null },
    {
      successMessage: 'Project renamed successfully',
      ...options
    }
  )
}

export function useMoveFolderAction(options: Omit<UseVaultActionOptions, 'successMessage'> = {}) {
  const { moveFolderAction } = require('@/actions/vault/folder')
  
  return useVaultAction(
    moveFolderAction,
    { success: false, error: null },
    {
      successMessage: 'Folder moved successfully',
      ...options
    }
  )
}

export function useMoveProjectAction(options: Omit<UseVaultActionOptions, 'successMessage'> = {}) {
  const { moveProjectAction } = require('@/actions/vault/project')
  
  return useVaultAction(
    moveProjectAction,
    { success: false, error: null },
    {
      successMessage: 'Project moved successfully',
      ...options
    }
  )
}

export function useCombineProjectsAction(options: Omit<UseVaultActionOptions, 'successMessage'> = {}) {
  const { createFolderFromProjectsAction } = require('@/actions/vault/project')
  
  return useVaultAction(
    createFolderFromProjectsAction,
    { success: false, error: null },
    {
      successMessage: 'Projects combined successfully',
      ...options
    }
  )
} 