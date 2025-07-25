'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { upload } from '@vercel/blob/client'
import type { ProjectWithTracks } from '@/db/schema/library'
import { nanoid } from 'nanoid'

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
  const queryKey = ['project', projectId]

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
        handleUploadUrl: '/api/upload',
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

  return {
    project: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    uploadTrack: uploadTrackMutation.mutateAsync,
    uploadTracks,
    isUploading: uploadTrackMutation.isPending,
  }
} 