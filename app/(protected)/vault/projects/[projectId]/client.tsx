'use client';

import { useAtom } from 'jotai';
import {
  Archive,
  Copy,
  Edit2,
  ExternalLink,
  Image as ImageIcon,
  MoreHorizontal,
  Play,
  Share,
  Shuffle,
  Trash2,
  Upload,
} from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TracksTable } from '@/components/vault/tracks/table';
import { UploadTrackDialog } from '@/components/vault/tracks/upload-dialog';
import { useRootFolders } from '@/hooks/data/use-folder';
import { useProject, useRootProjects } from '@/hooks/data/use-project';
import { useProjectTrackUrls } from '@/hooks/data/use-track-url';
import type { TrackWithVersions } from '@/lib/contracts/track';
import { playerControlsAtom } from '@/state/audio-atoms';
import type { AudioTrack } from '@/types/audio';

type ProjectViewProps = {
  projectId: string;
};

export function ProjectView({ projectId }: ProjectViewProps) {
  const {
    project,
    uploadTracks,
    isUploading,
    uploadImage,
    isUploadingImage,
    presignedImageUrl,
  } = useProject({
    projectId,
  });

  // Get presigned URLs for all tracks
  const { urlMap } = useProjectTrackUrls(project?.tracks);

  // Get available projects for move operations
  const { data: folders = [] } = useRootFolders();
  const { data: vaultProjects = [] } = useRootProjects();

  const availableProjects = [
    ...vaultProjects,
    ...folders.flatMap((folder) =>
      folder.projects.map((p) => ({ ...p, trackCount: p.trackCount ?? 0 }))
    ),
  ];

  // // Debug: Log when project data changes
  // useEffect(() => {
  //   console.log('🎵 ProjectView project updated:', project.tracks?.length || 0, 'tracks')
  // }, [project.tracks?.length])

  const [isDragOver, setIsDragOver] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [, dispatchPlayerAction] = useAtom(playerControlsAtom);

  // project will now be reactive to mutations thanks to placeholderData
  if (!project) {
    return null;
  }

  const totalDuration = (project.tracks || []).reduce(
    (sum: number, track: TrackWithVersions) => {
      return sum + (track.activeVersion?.duration || 0);
    },
    0
  );

  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const handlePlayAll = () => {
    if (!project.tracks || project.tracks.length === 0) {
      return;
    }

    // Convert tracks to AudioTrack format with presigned URLs
    const audioTracks: AudioTrack[] = project.tracks
      .filter(
        (track) => Boolean(track.activeVersion?.fileKey) && urlMap.get(track.id)
      )
      .map((track) => ({
        id: track.id,
        key: track.activeVersion ? track.activeVersion.fileKey : '',
        title: track.name,
        url: urlMap.get(track.id) || '',
        duration: track.activeVersion?.duration || undefined,
        createdAt: track.createdAt,
        type: 'uploaded' as const,
      }));

    if (audioTracks.length === 0) {
      toast.error('No tracks available to play');
      return;
    }

    // Play the entire project as a queue
    dispatchPlayerAction({
      type: 'PLAY_PROJECT',
      payload: {
        tracks: audioTracks,
        startIndex: 0,
        projectId: project.id,
        projectName: project.name,
      },
    });
  };

  const handleShuffle = () => {
    if (!project.tracks || project.tracks.length === 0) {
      toast.error('No tracks to shuffle');
      return;
    }

    // Convert tracks to AudioTrack format with presigned URLs
    const audioTracks: AudioTrack[] = project.tracks
      .filter(
        (track) => Boolean(track.activeVersion?.fileKey) && urlMap.get(track.id)
      )
      .map((track) => ({
        id: track.id,
        key: track.activeVersion ? track.activeVersion.fileKey : '',
        title: track.name,
        url: urlMap.get(track.id) || '',
        duration: track.activeVersion?.duration || undefined,
        createdAt: track.createdAt,
        type: 'uploaded' as const,
      }));

    if (audioTracks.length === 0) {
      toast.error('No tracks available to shuffle');
      return;
    }

    // Play project with shuffle enabled
    dispatchPlayerAction({
      type: 'PLAY_PROJECT',
      payload: {
        tracks: audioTracks,
        startIndex: 0,
        projectId: project.id,
        projectName: project.name,
      },
    });

    // Enable shuffle mode
    dispatchPlayerAction({ type: 'TOGGLE_SHUFFLE' });
    toast.success('Playing in shuffle mode');
  };

  const handleShare = async () => {
    try {
      const projectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/vault/projects/${projectId}`;
      await navigator.clipboard.writeText(projectUrl);
      toast.success('Project link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleCopyProjectId = async () => {
    try {
      await navigator.clipboard.writeText(projectId);
      toast.success('Project ID copied to clipboard');
    } catch {
      toast.error('Failed to copy project ID');
    }
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('audio/')
    );

    if (files.length === 0) {
      toast.error('Please drop audio files only');
      return;
    }

    // Use optimistic uploads from the hook
    await uploadTracks(files);
  };

  const getImageSrc = () => {
    if (project.image?.startsWith('blob:')) {
      return project.image;
    }
    if (project.image && presignedImageUrl) {
      return presignedImageUrl;
    }
    return null;
  };

  const imageSrc = getImageSrc();

  return (
    <div
      aria-label="Audio file drop zone"
      className={`min-h-screen bg-gradient-to-b from-background to-muted/20 transition-colors ${isDragOver ? 'border-primary bg-primary/5' : ''
        } ${isUploading ? 'pointer-events-none' : ''}`}
      onDragLeave={(e) => {
        // Only hide drag over if we're leaving the main container
        if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
          setIsDragOver(false);
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!isUploading) {
          setIsDragOver(true);
        }
      }}
      onDrop={handleFileDrop}
      ref={dropZoneRef}
      role="application"
    >
      {/* Drag Overlay */}
      {(isDragOver || isUploading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/10 backdrop-blur-sm">
          <div className="rounded-lg border-2 border-primary border-dashed bg-background p-8 text-center">
            <Upload className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h3 className="mb-2 font-semibold text-lg">
              {isUploading ? 'Uploading files...' : 'Drop audio files here'}
            </h3>
            <p className="text-muted-foreground">
              {isUploading
                ? 'Please wait while files are being processed'
                : `Files will be added to ${project.name}`}
            </p>
          </div>
        </div>
      )}

      {/* Project Hero Section */}
      <div className="space-y-6 p-6">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-end">
          {/* Album Art */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <ContextMenu>
                  <ContextMenuTrigger asChild>
                    <div
                      className="group relative h-48 w-48 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 border-transparent shadow-lg transition-colors group-hover:border-primary/50 md:h-64 md:w-64"
                      onClick={(e) => {
                        e.preventDefault();
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.multiple = false;
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) {
                            await uploadImage(file);
                          }
                        };
                        input.click();
                      }}
                    >
                      {isUploadingImage && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
                          <Upload className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                      {imageSrc ? (
                        <Image
                          alt={project.name}
                          className="object-cover"
                          fill
                          priority
                          sizes="(max-width: 768px) 192px, 256px"
                          src={imageSrc}
                        />
                      ) : project.image && !presignedImageUrl ? (
                        // Image exists but presigned URL is loading
                        <div className="flex h-full w-full animate-pulse items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
                          <span className="font-bold text-4xl text-white">
                            {project.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      ) : (
                        // No image at all
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-red-900">
                          {/* Placeholder abstract design */}
                          <ImageIcon className="h-6 w-6 text-white" />
                        </div>
                      )}
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                        <div className="rounded-lg bg-black/60 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <ImageIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-48">
                    <ContextMenuItem
                      disabled={isUploadingImage}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.multiple = false;
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) {
                            await uploadImage(file);
                          }
                        };
                        input.click();
                      }}
                    >
                      {isUploadingImage ? (
                        <Upload className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ImageIcon className="mr-2 h-4 w-4" />
                      )}
                      {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to upload project image</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Project Info */}
          <div className="flex flex-1 flex-col justify-center space-y-4 text-center md:justify-end md:text-left">
            <div className="space-y-2">
              <p className="font-medium text-muted-foreground text-sm">
                PROJECT
              </p>
              <h1 className="font-bold text-3xl tracking-tight md:text-4xl">
                {project.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-2 text-muted-foreground md:justify-start">
                <span>{project.tracks?.length || 0} tracks</span>
                <span>•</span>
                <span>{formatTotalDuration(totalDuration)}</span>
                {project.accessType !== 'private' && (
                  <>
                    <span>•</span>
                    <Badge className="text-xs" variant="secondary">
                      {String(project.accessType)}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <Button
            className="rounded-full px-6 sm:px-8"
            disabled={
              !project.tracks || project.tracks.length === 0 || isUploading
            }
            onClick={handlePlayAll}
            size="lg"
          >
            <Play className="mr-2 h-5 w-5" />
            Play
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="h-12 w-12 rounded-full p-0"
                  disabled={
                    !project.tracks ||
                    project.tracks.length === 0 ||
                    isUploading
                  }
                  onClick={handleShuffle}
                  size="lg"
                  variant="ghost"
                >
                  <Shuffle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Shuffle play</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <UploadTrackDialog projectId={projectId} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={isUploading} size="sm" variant="ghost">
                <Share className="mr-2 h-4 w-4" />
                Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleShare}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyProjectId}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Copy Project ID
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={isUploading} size="sm" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <Edit2 className="mr-2 h-4 w-4" />
                Rename Project
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Archive className="mr-2 h-4 w-4" />
                Archive Project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Track List - Refactored Table */}
        {project.tracks && project.tracks.length > 0 ? (
          <div>
            <TracksTable
              availableProjects={availableProjects}
              projectId={projectId}
              tracks={project.tracks}
            />
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-lg bg-muted">
                <Play className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 font-semibold">No tracks yet</h3>
              <p className="mb-4 max-w-sm text-center text-muted-foreground text-sm">
                Upload your first track to get started with this project. You
                can drag & drop files here or use the upload button.
              </p>
              <UploadTrackDialog
                projectId={projectId}
                triggerText="Upload Track"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
