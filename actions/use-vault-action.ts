'use client'

import { useActionState } from 'react'
import { toast } from 'sonner'
import { useVaultInvalidation } from '@/hooks/use-vault'

type BaseActionState = {
  success: boolean
  error: string | null
}

interface UseVaultActionOptions {
  successMessage?: string
  onSuccess?: (result: any) => void
  invalidationStrategy?: 'all' | 'sidebar' | 'specific'
  specificInvalidations?: () => void
}

export function useVaultAction(
  action: (prevState: any, formData: FormData) => Promise<any>,
  initialState: BaseActionState,
  options: UseVaultActionOptions = {}
) {
  const invalidate = useVaultInvalidation()
  const {
    successMessage,
    onSuccess,
    invalidationStrategy = 'all',
    specificInvalidations
  } = options

  const wrappedAction = async (prevState: any, payload: FormData) => {
    const result = await action(prevState, payload)
    
    if (result.success) {
      // Show success message
      if (successMessage) {
        toast.success(successMessage)
      }
      
      // Automatically invalidate React Query cache
      switch (invalidationStrategy) {
        case 'sidebar':
          invalidate.invalidateSidebar()
          break
        case 'specific':
          specificInvalidations?.()
          break
        case 'all':
        default:
          invalidate.invalidateAll()
          break
      }
      
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
  const { createFolderAction } = require('@/actions/vault')
  
  return useVaultAction(
    createFolderAction,
    { success: false, error: null },
    {
      successMessage: 'Folder created successfully',
      invalidationStrategy: 'sidebar',
      ...options
    }
  )
}

export function useCreateProjectAction(options: Omit<UseVaultActionOptions, 'successMessage'> = {}) {
  const { createProjectAction } = require('@/actions/vault')
  
  return useVaultAction(
    createProjectAction,
    { success: false, error: null },
    {
      successMessage: 'Project created successfully',
      invalidationStrategy: 'sidebar',
      ...options
    }
  )
}

export function useDeleteFolderAction(options: Omit<UseVaultActionOptions, 'successMessage'> = {}) {
  const { deleteFolderAction } = require('@/actions/vault')
  
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
  const { deleteProjectAction } = require('@/actions/vault')
  
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
  const { renameFolderAction } = require('@/actions/vault')
  
  return useVaultAction(
    renameFolderAction,
    { success: false, error: null },
    {
      successMessage: 'Folder renamed successfully',
      invalidationStrategy: 'all',
      ...options
    }
  )
}

export function useRenameProjectAction(options: Omit<UseVaultActionOptions, 'successMessage'> = {}) {
  const { renameProjectAction } = require('@/actions/vault')
  
  return useVaultAction(
    renameProjectAction,
    { success: false, error: null },
    {
      successMessage: 'Project renamed successfully',
      invalidationStrategy: 'all',
      ...options
    }
  )
}

export function useMoveFolderAction(options: Omit<UseVaultActionOptions, 'successMessage'> = {}) {
  const { moveFolderAction } = require('@/actions/vault')
  
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
  const { moveProjectAction } = require('@/actions/vault')
  
  return useVaultAction(
    moveProjectAction,
    { success: false, error: null },
    {
      successMessage: 'Project moved successfully',
      ...options
    }
  )
} 