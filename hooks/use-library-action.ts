'use client'

import { useActionState } from 'react'
import { toast } from 'sonner'
import { useLibraryInvalidation } from './use-library'

type BaseActionState = {
  success: boolean
  error: string | null
}

interface UseLibraryActionOptions {
  successMessage?: string
  onSuccess?: (result: any) => void
  invalidationStrategy?: 'all' | 'sidebar' | 'specific'
  specificInvalidations?: () => void
}

export function useLibraryAction(
  action: (prevState: any, formData: FormData) => Promise<any>,
  initialState: BaseActionState,
  options: UseLibraryActionOptions = {}
) {
  const invalidate = useLibraryInvalidation()
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
export function useCreateFolderAction(options: Omit<UseLibraryActionOptions, 'successMessage'> = {}) {
  const { createFolderAction } = require('@/actions/library')
  
  return useLibraryAction(
    createFolderAction,
    { success: false, error: null },
    {
      successMessage: 'Folder created successfully',
      invalidationStrategy: 'sidebar',
      ...options
    }
  )
}

export function useCreateProjectAction(options: Omit<UseLibraryActionOptions, 'successMessage'> = {}) {
  const { createProjectAction } = require('@/actions/library')
  
  return useLibraryAction(
    createProjectAction,
    { success: false, error: null },
    {
      successMessage: 'Project created successfully',
      invalidationStrategy: 'sidebar',
      ...options
    }
  )
}

export function useDeleteFolderAction(options: Omit<UseLibraryActionOptions, 'successMessage'> = {}) {
  const { deleteFolderAction } = require('@/actions/library')
  
  return useLibraryAction(
    deleteFolderAction,
    { success: false, error: null },
    {
      successMessage: 'Folder deleted successfully',
      ...options
    }
  )
}

export function useDeleteProjectAction(options: Omit<UseLibraryActionOptions, 'successMessage'> = {}) {
  const { deleteProjectAction } = require('@/actions/library')
  
  return useLibraryAction(
    deleteProjectAction,
    { success: false, error: null },
    {
      successMessage: 'Project deleted successfully',
      ...options
    }
  )
}

export function useRenameFolderAction(options: Omit<UseLibraryActionOptions, 'successMessage'> = {}) {
  const { renameFolderAction } = require('@/actions/library')
  
  return useLibraryAction(
    renameFolderAction,
    { success: false, error: null },
    {
      successMessage: 'Folder renamed successfully',
      ...options
    }
  )
}

export function useRenameProjectAction(options: Omit<UseLibraryActionOptions, 'successMessage'> = {}) {
  const { renameProjectAction } = require('@/actions/library')
  
  return useLibraryAction(
    renameProjectAction,
    { success: false, error: null },
    {
      successMessage: 'Project renamed successfully',
      ...options
    }
  )
}

export function useMoveFolderAction(options: Omit<UseLibraryActionOptions, 'successMessage'> = {}) {
  const { moveFolderAction } = require('@/actions/library')
  
  return useLibraryAction(
    moveFolderAction,
    { success: false, error: null },
    {
      successMessage: 'Folder moved successfully',
      ...options
    }
  )
}

export function useMoveProjectAction(options: Omit<UseLibraryActionOptions, 'successMessage'> = {}) {
  const { moveProjectAction } = require('@/actions/library')
  
  return useLibraryAction(
    moveProjectAction,
    { success: false, error: null },
    {
      successMessage: 'Project moved successfully',
      ...options
    }
  )
} 