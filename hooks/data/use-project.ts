'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { upload } from '@vercel/blob/client'
import type { ProjectWithTracks } from '@/db/schema/vault'
import type { ProjectImageResponse } from '@/types/project'
import { nanoid } from 'nanoid'
import { vaultKeys } from './use-vault'

interface UseProjectProps {
  projectId: string
  initialData?: ProjectWithTracks
}

interface UploadTrackData {
  name: string
  file: File
  duration?: number
}

export function useProject({ projectId, initialData }: UseProjectProps) {
  const queryClient = useQueryClient()
  const queryKey = vaultKeys.project(projectId)

  // Fetch project data
  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<ProjectWithTracks> => {
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch project')
      }
      return response.json()
    },
    initialData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })

  // Helper function to extract audio duration from file
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = document.createElement('audio')
      const url = URL.createObjectURL(file)
      
      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(url)
        resolve(audio.duration || 0)
      })
      
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url)
        resolve(0)
      })
      
      audio.src = url
    })
  }

  // Upload track mutation with optimistic updates
  const uploadTrackMutation = useMutation({
    mutationFn: async ({ name, file, duration }: UploadTrackData) => {
      // Upload to Vercel Blob
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/vault/upload',
      })

      // Create track in database
      const response = await fetch('/api/tracks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          projectId,
          fileUrl: blob.url,
          fileSize: file.size,
          mimeType: file.type,
          duration: duration || 0
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      return response.json()
    },
    onMutate: async ({ name, file, duration }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousProject = queryClient.getQueryData<ProjectWithTracks>(queryKey)

      // Create optimistic track
      const optimisticTrack = {
        id: `temp-${nanoid()}`, // Temporary ID
        name: name.trim(),
        projectId,
        userId: '', // Will be filled by server
        activeVersionId: `temp-version-${nanoid()}`,
        accessType: 'private' as const,
        order: previousProject?.tracks?.length ?? 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: null,
        activeVersion: {
          id: `temp-version-${nanoid()}`,
          trackId: `temp-${nanoid()}`,
          version: 1,
          fileUrl: URL.createObjectURL(file), // Temporary blob URL for preview
          size: file.size,
          duration: duration || 0,
          mimeType: file.type,
          createdAt: new Date(),
          metadata: null,
        },
        versions: [{
          id: `temp-version-${nanoid()}`,
          trackId: `temp-${nanoid()}`,
          version: 1,
          fileUrl: URL.createObjectURL(file),
          size: file.size,
          duration: duration || 0,
          mimeType: file.type,
          createdAt: new Date(),
          metadata: null,
        }],
        project: previousProject!
      }

      // Optimistically update to the new value
      if (previousProject) {
        queryClient.setQueryData<ProjectWithTracks>(queryKey, {
          ...previousProject,
          tracks: [...(previousProject.tracks ?? []), optimisticTrack]
        })
      }

      return { previousProject, optimisticTrack }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(queryKey, context.previousProject)
      }
      toast.error(`Failed to upload ${variables.name}: ${error.message}`)
    },
    onSuccess: (data, variables) => {
      toast.success(`${variables.name} uploaded successfully`)
      // The server data will replace the optimistic data
      queryClient.invalidateQueries({ queryKey })
    },
    onSettled: (data, error, variables, context) => {
      // Clean up optimistic blob URLs from track upload
      if (context?.optimisticTrack?.activeVersion?.fileUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(context.optimisticTrack.activeVersion.fileUrl)
      }
      if (context?.optimisticTrack?.versions?.[0]?.fileUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(context.optimisticTrack.versions[0].fileUrl)
      }
    },
  })

  // Upload multiple tracks
  const uploadTracks = async (files: File[]) => {
    const uploads = files.map(async (file) => {
      const duration = await getAudioDuration(file)
      const name = file.name.replace(/\.[^/.]+$/, "")
      
      return uploadTrackMutation.mutateAsync({
        name,
        file,
        duration
      })
    })

    try {
      await Promise.all(uploads)
      toast.success(`${files.length} track(s) uploaded successfully`)
    } catch {
      toast.error('Some uploads failed')
    }
  }

  // Upload project image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File): Promise<ProjectImageResponse> => {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/projects/${projectId}/image`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      return response.json()
    },
    onMutate: async (file: File) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey })
      
      // Snapshot the previous value
      const previousProject = queryClient.getQueryData<ProjectWithTracks>(queryKey)
      
      // Create optimistic image URL - this will be replaced with real URL on success
      const optimisticImageUrl = URL.createObjectURL(file)
      
      // Optimistically update project cache
      queryClient.setQueryData<ProjectWithTracks>(queryKey, (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          image: optimisticImageUrl
        }
      })
      
      // Optimistically update all folder queries that contain this project
      queryClient.setQueriesData(
        { predicate: (query) => 
          query.queryKey[0] === 'vault' && 
          query.queryKey[1] === 'folders' && 
          query.queryKey.length === 3 // Individual folder: ['vault', 'folders', folderId]
        },
        (oldData: unknown) => {
          if (!oldData || typeof oldData !== 'object') return oldData
          
          const folderData = oldData as { 
            projects?: ProjectWithTracks[]
            subFolders?: { projects?: ProjectWithTracks[] }[]
          }
          
          // Helper function to update projects recursively
          const updateProjectsRecursively = (data: any): any => {
            let updated = { ...data }
            
            // Update direct projects
            if (updated.projects) {
              updated.projects = updated.projects.map((p: any) => 
                p.id === projectId 
                  ? { ...p, image: optimisticImageUrl }
                  : p
              )
            }
            
            // Update projects in subfolders
            if (updated.subFolders) {
              updated.subFolders = updated.subFolders.map((subfolder: any) =>
                updateProjectsRecursively(subfolder)
              )
            }
            
            return updated
          }
          
          return updateProjectsRecursively(folderData)
        }
      )
      
      // Also update root vault projects cache
      queryClient.setQueryData<ProjectWithTracks[]>(vaultKeys.vaultProjects(), (oldProjects) => {
        if (!oldProjects) return oldProjects
        return oldProjects.map(p => 
          p.id === projectId 
            ? { ...p, image: optimisticImageUrl }
            : p
        )
      })
      
      // Return context object with snapshotted value and optimistic URL
      return { previousProject, optimisticImageUrl }
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(queryKey, context.previousProject)
      }
      
      // Rollback folder queries
      queryClient.setQueriesData(
        { predicate: (query) => 
          query.queryKey[0] === 'vault' && 
          query.queryKey[1] === 'folders' && 
          query.queryKey.length === 3 // Individual folder: ['vault', 'folders', folderId]
        },
        (oldData: unknown) => {
          if (!oldData || typeof oldData !== 'object' || !context?.previousProject) return oldData
          
          const folderData = oldData as { 
            projects?: ProjectWithTracks[]
            subFolders?: { projects?: ProjectWithTracks[] }[]
          }
          
          // Helper function to rollback projects recursively
          const rollbackProjectsRecursively = (data: any): any => {
            let updated = { ...data }
            
            // Rollback direct projects
            if (updated.projects) {
              updated.projects = updated.projects.map((p: any) => 
                p.id === projectId 
                  ? { ...p, image: context.previousProject?.image || null }
                  : p
              )
            }
            
            // Rollback projects in subfolders
            if (updated.subFolders) {
              updated.subFolders = updated.subFolders.map((subfolder: any) =>
                rollbackProjectsRecursively(subfolder)
              )
            }
            
            return updated
          }
          
          return rollbackProjectsRecursively(folderData)
        }
      )
      
      // Also rollback root vault projects cache
      if (context?.previousProject) {
        queryClient.setQueryData<ProjectWithTracks[]>(vaultKeys.vaultProjects(), (oldProjects) => {
          if (!oldProjects) return oldProjects
          return oldProjects.map(p => 
            p.id === projectId 
              ? { ...p, image: context.previousProject?.image || null }
              : p
          )
        })
      }
      
      toast.error(`Failed to upload image: ${error.message}`)
    },
    onSuccess: (data, variables, context) => {
      if (data.success && data.imageUrl) {
        // Update the project cache with real image URL (replacing optimistic data)
        queryClient.setQueryData<ProjectWithTracks>(queryKey, (oldData) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            image: data.imageUrl || null
          }
        })
        
        // Update all folder queries with real URL (replacing optimistic data)
        queryClient.setQueriesData(
          { predicate: (query) => 
            query.queryKey[0] === 'vault' && 
            query.queryKey[1] === 'folders' && 
            query.queryKey.length === 3 // Individual folder: ['vault', 'folders', folderId]
          },
          (oldData: unknown) => {
            if (!oldData || typeof oldData !== 'object') return oldData
            
            const folderData = oldData as { 
              projects?: ProjectWithTracks[]
              subFolders?: { projects?: ProjectWithTracks[] }[]
            }
            
            // Helper function to update projects recursively with real URL
            const updateProjectsRecursively = (folderData: any): any => {
              let updated = { ...folderData }
              
              // Update direct projects
              if (updated.projects) {
                updated.projects = updated.projects.map((p: any) => 
                  p.id === projectId 
                    ? { ...p, image: data.imageUrl || null }
                    : p
                )
              }
              
              // Update projects in subfolders
              if (updated.subFolders) {
                updated.subFolders = updated.subFolders.map((subfolder: any) =>
                  updateProjectsRecursively(subfolder)
                )
              }
              
              return updated
            }
            
            return updateProjectsRecursively(folderData)
          }
        )
        
        // Also update root vault projects cache with real URL
        queryClient.setQueryData<ProjectWithTracks[]>(vaultKeys.vaultProjects(), (oldProjects) => {
          if (!oldProjects) return oldProjects
          return oldProjects.map(p => 
            p.id === projectId 
              ? { ...p, image: data.imageUrl || null }
              : p
          )
        })
        
        toast.success('Project image updated successfully')
      }
    },
    onSettled: (data, error, variables, context) => {
      // Always clean up the optimistic blob URL after mutation completes
      if (context?.optimisticImageUrl) {
        URL.revokeObjectURL(context.optimisticImageUrl)
      }
    },
  })

  return {
    project: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    uploadTrack: uploadTrackMutation.mutateAsync,
    uploadTracks,
    isUploading: uploadTrackMutation.isPending,
    uploadImage: uploadImageMutation.mutateAsync,
    isUploadingImage: uploadImageMutation.isPending,
  }
} 