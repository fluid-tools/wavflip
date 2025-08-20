'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { generateWaveformData } from '@/lib/audio/waveform-generator';
import { ProjectsListResponseSchema } from '@/lib/contracts/api/projects';
import { TrackCreateFormSchema } from '@/lib/contracts/api/tracks';
import type { ProjectWithTracks } from '@/lib/contracts/project';
import { ProjectWithTracksSchema } from '@/lib/contracts/project';
import type { VaultData } from '@/lib/contracts/vault';
import type { ProjectImageResponse } from '@/lib/server/types/project';
import { vaultKeys, waveformKeys } from './keys';

interface UseProjectProps {
  projectId: string;
  initialData?: ProjectWithTracks;
  enabled?: boolean;
}

interface UploadTrackData {
  name: string;
  file: File;
  duration?: number;
}

export function useProject({
  projectId,
  initialData,
  enabled = true,
}: UseProjectProps) {
  const queryClient = useQueryClient();
  const queryKey = vaultKeys.project(projectId);

  // Fetch project data
  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<ProjectWithTracks> => {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }
      const json = await response.json();
      return ProjectWithTracksSchema.parse(json);
    },
    // Use placeholderData instead of initialData to ensure invalidation works
    placeholderData: initialData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: enabled && !!projectId,
  });

  // Fetch presigned image URL if project.image exists
  const presignedImageQuery = useQuery({
    queryKey: [queryKey, 'presigned-image'],
    queryFn: async () => {
      if (!query.data?.image) return null;

      // Check if we already have a prefetched presigned URL
      const cachedUrl = queryClient.getQueryData<string>([
        queryKey,
        'presigned-image',
      ]);
      if (cachedUrl) return cachedUrl;

      // Otherwise fetch from API
      const res = await fetch(`/api/projects/${projectId}/image`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.signedUrl as string;
    },
    enabled: !!query.data?.image,
    staleTime: 60 * 1000,
  });

  // Helper function to extract audio duration from file
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = document.createElement('audio');
      const url = URL.createObjectURL(file);

      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration || 0);
      });

      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        resolve(0);
      });

      audio.src = url;
    });
  };

  // Upload track mutation with optimistic updates
  const uploadTrackMutation = useMutation({
    mutationFn: async ({ name, file, duration }: UploadTrackData) => {
      // Get presigned URL from server
      const presignedResponse = await fetch('/api/tracks/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          projectId,
        }),
      });

      if (!presignedResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { presigned, trackId, key } = await presignedResponse.json();

      // Upload directly to S3 using presigned POST
      const formData = new FormData();
      Object.entries(presigned.fields).forEach(([k, v]) => {
        formData.append(k, v as string);
      });
      formData.append('file', file);

      const uploadResponse = await fetch(presigned.url, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3');
      }

      // Create track in database - store S3 key (FormData + Zod validation)
      const validated = TrackCreateFormSchema.parse({
        name: name.trim(),
        projectId,
        fileKey: key,
        fileSize: file.size,
        mimeType: file.type,
        duration: duration || 0,
      });
      const fd = new FormData();
      fd.set('name', validated.name);
      fd.set('projectId', validated.projectId);
      fd.set('fileKey', validated.fileKey);
      if (validated.fileSize != null)
        fd.set('fileSize', String(validated.fileSize));
      if (validated.mimeType) fd.set('mimeType', validated.mimeType);
      if (validated.duration != null)
        fd.set('duration', String(validated.duration));

      const response = await fetch('/api/tracks', {
        method: 'POST',
        body: fd,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      // Fire-and-forget: compute real peaks using shared generator and POST to Redis
      (async () => {
        try {
          const arrayBuf = await file.arrayBuffer();
          const wf = await generateWaveformData(arrayBuf);
          await fetch(`/api/waveform/${encodeURIComponent(key)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              peaks: wf.peaks,
              duration: wf.duration,
              sampleRate: wf.sampleRate,
              channels: wf.channels,
            }),
          });
          // Optimistically set and invalidate per waveform-data rule
          queryClient.setQueryData(waveformKeys.byKey(key), {
            data: {
              peaks: wf.peaks,
              duration: wf.duration,
              sampleRate: wf.sampleRate,
              channels: wf.channels,
              bits: 16,
            },
            isPlaceholder: false,
            generatedAt: new Date().toISOString(),
            key,
          });
          queryClient.invalidateQueries({ queryKey: waveformKeys.byKey(key) });
        } catch (err) {
          console.warn('Failed to persist real waveform for upload:', err);
        }
      })();

      return response.json();
    },
    onMutate: async ({ name, file, duration }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousProject =
        queryClient.getQueryData<ProjectWithTracks>(queryKey);

      // Create optimistic track
      const tempBlobUrl = URL.createObjectURL(file);
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
          fileKey: `blob:${file.name}`,
          size: file.size,
          duration: duration || 0,
          mimeType: file.type,
          createdAt: new Date(),
          metadata: { tempBlobUrl },
        },
        versions: [
          {
            id: `temp-version-${nanoid()}`,
            trackId: `temp-${nanoid()}`,
            version: 1,
            fileKey: `blob:${file.name}`,
            size: file.size,
            duration: duration || 0,
            mimeType: file.type,
            createdAt: new Date(),
            metadata: { tempBlobUrl },
          },
        ],
        project: previousProject!,
      };

      // Optimistically update to the new value
      if (previousProject) {
        queryClient.setQueryData<ProjectWithTracks>(queryKey, {
          ...previousProject,
          tracks: [...(previousProject.tracks ?? []), optimisticTrack],
        });
      }

      return { previousProject, optimisticTrack, tempBlobUrl };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(queryKey, context.previousProject);
      }
      toast.error(`Failed to upload ${variables.name}: ${error.message}`);
    },
    onSuccess: async (data, variables, context) => {
      toast.success(`${variables.name} uploaded successfully`);
      // Replace optimistic track with server track in project cache
      try {
        const serverTrack = data?.track;
        if (context?.previousProject && serverTrack) {
          queryClient.setQueryData<ProjectWithTracks>(queryKey, (old) => {
            if (!old) return old;
            const withoutTemps = (old.tracks ?? []).filter(
              (t) => !t.id.startsWith('temp-')
            );
            return { ...old, tracks: [...withoutTemps, serverTrack] };
          });
        }
      } finally {
        // Invalidate tree and sidebar data to update counts
        queryClient.invalidateQueries({ queryKey: vaultKeys.base });
        queryClient.invalidateQueries({ queryKey });
      }
    },
    onSettled: (data, error, variables, context) => {
      // Clean up optimistic blob URL from track upload
      if (context?.tempBlobUrl) {
        URL.revokeObjectURL(context.tempBlobUrl);
      }
    },
  });

  // Upload multiple tracks
  const uploadTracks = async (files: File[]) => {
    const uploads = files.map(async (file) => {
      const duration = await getAudioDuration(file);
      const name = file.name.replace(/\.[^/.]+$/, '');

      return uploadTrackMutation.mutateAsync({
        name,
        file,
        duration,
      });
    });

    try {
      await Promise.all(uploads);
      toast.success(`${files.length} track(s) uploaded successfully`);
    } catch {
      toast.error('Some uploads failed');
    }
  };

  // Upload project image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File): Promise<ProjectImageResponse> => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/projects/${projectId}/image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onMutate: async (file: File) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousProject =
        queryClient.getQueryData<ProjectWithTracks>(queryKey);

      // Create optimistic image URL - this will be replaced with real URL on success
      const optimisticImageUrl = URL.createObjectURL(file);

      // Optimistically update project cache
      queryClient.setQueryData<ProjectWithTracks>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          image: optimisticImageUrl,
        };
      });

      // Optimistically update all folder queries that contain this project
      queryClient.setQueriesData(
        {
          predicate: (query) =>
            query.queryKey[0] === 'vault' &&
            query.queryKey[1] === 'folders' &&
            query.queryKey.length === 3, // Individual folder: ['vault', 'folders', folderId]
        },
        (oldData: unknown) => {
          if (!oldData || typeof oldData !== 'object') return oldData;

          const folderData = oldData as {
            projects?: ProjectWithTracks[];
            subFolders?: { projects?: ProjectWithTracks[] }[];
          };

          // Helper function to update projects recursively
          const updateProjectsRecursively = (data: any): any => {
            const updated = { ...data };

            // Update direct projects
            if (updated.projects) {
              updated.projects = updated.projects.map((p: any) =>
                p.id === projectId ? { ...p, image: optimisticImageUrl } : p
              );
            }

            // Update projects in subfolders
            if (updated.subFolders) {
              updated.subFolders = updated.subFolders.map((subfolder: any) =>
                updateProjectsRecursively(subfolder)
              );
            }

            return updated;
          };

          return updateProjectsRecursively(folderData);
        }
      );

      // Also update root vault projects cache
      queryClient.setQueryData<ProjectWithTracks[]>(
        vaultKeys.projects(),
        (oldProjects) => {
          if (!oldProjects) return oldProjects;
          return oldProjects.map((p) =>
            p.id === projectId ? { ...p, image: optimisticImageUrl } : p
          );
        }
      );

      // Return context object with snapshotted value and optimistic URL
      return { previousProject, optimisticImageUrl };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(queryKey, context.previousProject);
      }

      // Rollback folder queries
      queryClient.setQueriesData(
        {
          predicate: (query) =>
            query.queryKey[0] === 'vault' &&
            query.queryKey[1] === 'folders' &&
            query.queryKey.length === 3, // Individual folder: ['vault', 'folders', folderId]
        },
        (oldData: unknown) => {
          if (
            !oldData ||
            typeof oldData !== 'object' ||
            !context?.previousProject
          )
            return oldData;

          const folderData = oldData as {
            projects?: ProjectWithTracks[];
            subFolders?: { projects?: ProjectWithTracks[] }[];
          };

          // Helper function to rollback projects recursively
          const rollbackProjectsRecursively = (data: any): any => {
            const updated = { ...data };

            // Rollback direct projects
            if (updated.projects) {
              updated.projects = updated.projects.map((p: any) =>
                p.id === projectId
                  ? { ...p, image: context.previousProject?.image || null }
                  : p
              );
            }

            // Rollback projects in subfolders
            if (updated.subFolders) {
              updated.subFolders = updated.subFolders.map((subfolder: any) =>
                rollbackProjectsRecursively(subfolder)
              );
            }

            return updated;
          };

          return rollbackProjectsRecursively(folderData);
        }
      );

      // Also rollback root vault projects cache
      if (context?.previousProject) {
        queryClient.setQueryData<ProjectWithTracks[]>(
          vaultKeys.projects(),
          (oldProjects) => {
            if (!oldProjects) return oldProjects;
            return oldProjects.map((p) =>
              p.id === projectId
                ? { ...p, image: context.previousProject?.image || null }
                : p
            );
          }
        );
      }

      toast.error(`Failed to upload image: ${error.message}`);
    },
    onSuccess: async (data, variables, context) => {
      if (data.success && data.resourceKey) {
        // First, fetch the presigned URL for the new image
        try {
          const res = await fetch(`/api/projects/${projectId}/image`);
          if (res.ok) {
            const { signedUrl } = await res.json();

            // Cache the presigned URL
            queryClient.setQueryData([queryKey, 'presigned-image'], signedUrl);

            // Now that we have the presigned URL, update all caches with the S3 key
            // The components will use the cached presigned URL
            queryClient.setQueryData<ProjectWithTracks>(queryKey, (oldData) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                image: data.resourceKey || null,
              };
            });

            // Update all folder queries with the S3 key
            queryClient.setQueriesData(
              {
                predicate: (query) =>
                  query.queryKey[0] === 'vault' &&
                  query.queryKey[1] === 'folders' &&
                  query.queryKey.length === 3, // Individual folder: ['vault', 'folders', folderId]
              },
              (oldData: unknown) => {
                if (!oldData || typeof oldData !== 'object') return oldData;

                const folderData = oldData as {
                  projects?: ProjectWithTracks[];
                  subFolders?: { projects?: ProjectWithTracks[] }[];
                };

                // Helper function to update projects recursively
                const updateProjectsRecursively = (folderData: any): any => {
                  const updated = { ...folderData };

                  // Update direct projects
                  if (updated.projects) {
                    updated.projects = updated.projects.map((p: any) =>
                      p.id === projectId
                        ? { ...p, image: data.resourceKey || null }
                        : p
                    );
                  }

                  // Update projects in subfolders
                  if (updated.subFolders) {
                    updated.subFolders = updated.subFolders.map(
                      (subfolder: any) => updateProjectsRecursively(subfolder)
                    );
                  }

                  return updated;
                };

                return updateProjectsRecursively(folderData);
              }
            );

            // Also update root vault projects cache
            queryClient.setQueryData<ProjectWithTracks[]>(
              vaultKeys.projects(),
              (oldProjects) => {
                if (!oldProjects) return oldProjects;
                return oldProjects.map((p) =>
                  p.id === projectId
                    ? { ...p, image: data.resourceKey || null }
                    : p
                );
              }
            );
          } else {
            // If we couldn't get presigned URL, still update but keep blob URL temporarily
            console.error('Failed to get presigned URL, keeping blob URL');
          }
        } catch (error) {
          console.error('Failed to fetch presigned URL after upload:', error);
        }

        toast.success('Project image updated successfully');
      }
    },
    onSettled: (data, error, variables, context) => {
      // Always clean up the optimistic blob URL after mutation completes
      if (context?.optimisticImageUrl) {
        URL.revokeObjectURL(context.optimisticImageUrl);
      }
    },
  });

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
    presignedImageUrl: presignedImageQuery.data,
  };
}

export function useRootProjects() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: vaultKeys.projects(),
    queryFn: async (): Promise<ProjectWithTracks[]> => {
      // Prefer hydrated tree cache
      const [treeEntry] = queryClient.getQueriesData<VaultData>({
        queryKey: vaultKeys.tree(),
      });
      const treeData = treeEntry?.[1];
      if (Array.isArray(treeData?.rootProjects)) {
        // Root projects in tree already include trackCount and basic fields
        return treeData.rootProjects as ProjectWithTracks[];
      }

      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch vault projects');
      const json = await response.json();
      return ProjectsListResponseSchema.parse(json);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
