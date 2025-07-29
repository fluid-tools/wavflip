import { useQueryClient } from '@tanstack/react-query'

export function useLibraryCache() {
  const queryClient = useQueryClient()

  const invalidateAll = () => {
    // Invalidate all library-related queries
    queryClient.invalidateQueries({ queryKey: ['library-sidebar'] })
    queryClient.invalidateQueries({ queryKey: ['folder-path'] })
    queryClient.invalidateQueries({ queryKey: ['project-data'] })
    queryClient.invalidateQueries({ queryKey: ['folder-data'] })
  }

  const invalidateFolder = (folderId: string) => {
    queryClient.invalidateQueries({ queryKey: ['folder-path', folderId] })
    queryClient.invalidateQueries({ queryKey: ['folder-data', folderId] })
    queryClient.invalidateQueries({ queryKey: ['library-sidebar'] })
  }

  const invalidateProject = (projectId: string) => {
    queryClient.invalidateQueries({ queryKey: ['project-data', projectId] })
    queryClient.invalidateQueries({ queryKey: ['library-sidebar'] })
  }

  const invalidateSidebar = () => {
    queryClient.invalidateQueries({ queryKey: ['library-sidebar'] })
  }

  return {
    invalidateAll,
    invalidateFolder,
    invalidateProject,
    invalidateSidebar,
  }
} 