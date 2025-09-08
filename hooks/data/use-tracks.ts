'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ProjectWithTracks } from '@/lib/contracts/project';
import { vaultKeys } from './keys';

type UseTracksProps = {
  projectId: string;
};

export type TrackFromProject = NonNullable<ProjectWithTracks['tracks']>[number];

export function useTracks({ projectId }: UseTracksProps) {
  const queryClient = useQueryClient();
  const queryKey = vaultKeys.project(projectId);

  // Delete track mutation with optimistic updates
  const deleteTrackMutation = useMutation({
    mutationFn: async (trackId: string) => {
      const formData = new FormData();
      formData.append('trackId', trackId);
      formData.append('projectId', projectId);

      const response = await fetch('/api/tracks', {
        method: 'DELETE',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onMutate: async (trackId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousProject =
        queryClient.getQueryData<ProjectWithTracks>(queryKey);

      // Optimistically remove the track
      if (previousProject) {
        const updatedTracks = (previousProject.tracks ?? []).filter(
          (track) => track.id !== trackId
        );
        queryClient.setQueryData<ProjectWithTracks>(queryKey, {
          ...previousProject,
          tracks: updatedTracks,
        });
      }

      return { previousProject, trackId };
    },
    onError: (error, _trackId, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(queryKey, context.previousProject);
      }
      toast.error(`Failed to delete track: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Track deleted successfully');
    },
    onSettled: () => {
      // Always invalidate to ensure we have the latest server state
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Rename track mutation with optimistic updates
  const renameTrackMutation = useMutation({
    mutationFn: async ({
      trackId,
      newName,
    }: {
      trackId: string;
      newName: string;
    }) => {
      const formData = new FormData();
      formData.append('trackId', trackId);
      formData.append('name', newName);
      formData.append('projectId', projectId);

      const response = await fetch('/api/tracks', {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onMutate: async ({ trackId, newName }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousProject =
        queryClient.getQueryData<ProjectWithTracks>(queryKey);

      // Optimistically update the track name
      if (previousProject) {
        const updatedTracks = (previousProject.tracks ?? []).map((track) =>
          track.id === trackId
            ? { ...track, name: newName.trim(), updatedAt: new Date() }
            : track
        );
        queryClient.setQueryData<ProjectWithTracks>(queryKey, {
          ...previousProject,
          tracks: updatedTracks,
        });
      }

      return { previousProject, trackId };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(queryKey, context.previousProject);
      }
      toast.error(`Failed to rename track: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Track renamed successfully');
    },
    onSettled: () => {
      // Always invalidate to ensure we have the latest server state
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteTrack = async (trackId: string) => {
    try {
      await deleteTrackMutation.mutateAsync(trackId);
    } catch {
      // Error handled by mutation
    }
  };

  const renameTrack = async (trackId: string, newName: string) => {
    try {
      await renameTrackMutation.mutateAsync({
        trackId,
        newName: newName.trim(),
      });
    } catch {
      // Error handled by mutation
    }
  };

  // Move track mutation with optimistic updates
  const moveTrackMutation = useMutation({
    mutationFn: async ({
      trackId,
      destinationProjectId,
    }: {
      trackId: string;
      destinationProjectId: string;
    }) => {
      const formData = new FormData();
      formData.append('trackId', trackId);
      formData.append('projectId', destinationProjectId);
      formData.append('sourceProjectId', projectId);

      const response = await fetch('/api/tracks/move', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onMutate: async ({ trackId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousProject =
        queryClient.getQueryData<ProjectWithTracks>(queryKey);

      // Optimistically remove the track from current project
      if (previousProject) {
        const updatedTracks = (previousProject.tracks ?? []).filter(
          (track) => track.id !== trackId
        );
        queryClient.setQueryData<ProjectWithTracks>(queryKey, {
          ...previousProject,
          tracks: updatedTracks,
        });
      }

      return { previousProject, trackId };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(queryKey, context.previousProject);
      }
      toast.error(`Failed to move track: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Track moved successfully');
    },
    onSettled: () => {
      // Always invalidate both source and destination projects
      queryClient.invalidateQueries({ queryKey });
      // Invalidate all vault queries to ensure destination project is updated
      queryClient.invalidateQueries({ queryKey: vaultKeys.base });
    },
  });

  const moveTrack = async (trackId: string, destinationProjectId: string) => {
    try {
      await moveTrackMutation.mutateAsync({ trackId, destinationProjectId });
    } catch {
      // Error handled by mutation
    }
  };

  return {
    deleteTrack,
    renameTrack,
    moveTrack,
    isDeleting: deleteTrackMutation.isPending,
    isRenaming: renameTrackMutation.isPending,
    isMoving: moveTrackMutation.isPending,
  };
}
