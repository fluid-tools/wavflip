'use client';

import { useAtom } from 'jotai';
import {
  Edit2,
  FolderOpen,
  MoreHorizontal,
  Pause,
  Play,
  Trash2,
  Upload,
} from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  currentTrackAtom,
  isPlayingAtom,
  playerControlsAtom,
} from '@/state/audio-atoms';
import type { TrackFromProject } from '../../../hooks/data/use-tracks';

type MobileTracksListProps = {
  tracks: TrackFromProject[];
  onPlayTrack: (track: TrackFromProject) => void;
  onRenameTrack: (track: TrackFromProject) => void;
  onDeleteTrack: (track: TrackFromProject) => void;
  onMoveTrack: (track: TrackFromProject) => void;
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) {
    return '--';
  }

  const dateObj = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(dateObj.getTime())) {
    return '--';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dateObj);
};

const getFileTypeDisplay = (mimeType: string): string => {
  const typeMap: Record<string, string> = {
    'audio/mpeg': 'MP3',
    'audio/wav': 'WAV',
    'audio/wave': 'WAV',
    'audio/x-wav': 'WAV',
    'audio/flac': 'FLAC',
    'audio/x-flac': 'FLAC',
    'audio/mp4': 'M4A',
    'audio/x-m4a': 'M4A',
    'audio/aac': 'AAC',
    'audio/ogg': 'OGG',
    'audio/webm': 'WEBM',
    'audio/3gpp': '3GP',
    'audio/amr': 'AMR',
  };

  return typeMap[mimeType] || 'UNKNOWN';
};

export function MobileTracksList({
  tracks,
  onPlayTrack,
  onRenameTrack,
  onDeleteTrack,
  onMoveTrack,
}: MobileTracksListProps) {
  const [currentTrack] = useAtom(currentTrackAtom);
  const [, dispatchPlayerAction] = useAtom(playerControlsAtom);
  const [isPlaying] = useAtom(isPlayingAtom);

  return (
    <div className="overflow-hidden rounded-lg border">
      <Virtuoso
        itemContent={(index) => {
          const track = tracks[index];
          const isCurrentTrack = currentTrack?.id === track.id;
          const isTrackPlaying = isCurrentTrack && isPlaying;
          const duration = track.activeVersion?.duration;
          const mimeType = track.activeVersion?.mimeType;

          return (
            <div
              className={cn(
                'flex items-center gap-3 border-border/50 border-b bg-background p-3 transition-colors last:border-b-0 hover:bg-muted/50',
                isCurrentTrack && 'bg-primary/5'
              )}
            >
              {/* Track Number / Play Button */}
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
                <Button
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    if (isTrackPlaying) {
                      dispatchPlayerAction({ type: 'PAUSE' });
                    } else if (isCurrentTrack) {
                      dispatchPlayerAction({ type: 'PLAY' });
                    } else {
                      onPlayTrack(track);
                    }
                  }}
                  size="sm"
                  variant="ghost"
                >
                  {isTrackPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Track Info */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h3
                    className={cn(
                      'truncate font-medium text-sm',
                      isCurrentTrack && 'text-primary'
                    )}
                  >
                    {track.name}
                  </h3>
                  {track.versions.length > 1 && (
                    <Badge className="flex-shrink-0 text-xs" variant="outline">
                      v{track.activeVersion?.version || 1}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <span className="truncate">
                    {formatDate(track.createdAt)}
                  </span>
                  <span>•</span>
                  <Badge className="text-xs" variant="secondary">
                    {mimeType ? getFileTypeDisplay(mimeType) : 'Unknown'}
                  </Badge>
                  {duration && (
                    <>
                      <span>•</span>
                      <span>{formatDuration(duration)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-8 w-8 flex-shrink-0 p-0" variant="ghost">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onRenameTrack(track)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onMoveTrack(track)}>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Move to Project
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload New Version
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDeleteTrack(track)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        }}
        style={{ height: '400px' }}
        totalCount={tracks.length}
      />
    </div>
  );
}
