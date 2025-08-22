'use client';

import type { ColumnDef } from '@tanstack/react-table';
import {
  ArrowUpDown,
  Edit2,
  FolderOpen,
  MoreHorizontal,
  Pause,
  Play,
  Trash2,
  Upload,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PlayerAction } from '@/state/audio-atoms';
import type { AudioTrack } from '@/types/audio';
import type { TrackFromProject } from '../../../hooks/data/use-tracks';

interface ColumnActionsProps {
  track: TrackFromProject;
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  onPlayTrack: (track: TrackFromProject) => void;
  onRenameTrack: (track: TrackFromProject) => void;
  onDeleteTrack: (track: TrackFromProject) => void;
  onMoveTrack: (track: TrackFromProject) => void;
  dispatchPlayerAction: (action: PlayerAction) => void;
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return '--';

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
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

  return typeMap[mimeType] || 'Audio';
};

export function createTracksTableColumns({
  currentTrack,
  isPlaying,
  onPlayTrack,
  onRenameTrack,
  onDeleteTrack,
  onMoveTrack,
  dispatchPlayerAction,
}: Omit<ColumnActionsProps, 'track'>): ColumnDef<TrackFromProject>[] {
  return [
    {
      id: 'play',
      header: '#',
      cell: ({ row, table }) => {
        const track = row.original;
        const index = table
          .getSortedRowModel()
          .rows.findIndex((r) => r.id === row.id);
        const isCurrentTrack = currentTrack?.id === track.id;
        const isTrackPlaying = isCurrentTrack && isPlaying;

        return (
          <div className="group flex h-8 w-8 items-center justify-center">
            <span className="text-muted-foreground text-sm group-hover:hidden">
              {index + 1}
            </span>
            <Button
              className="hidden h-8 w-8 p-0 opacity-0 transition-opacity group-hover:flex group-hover:opacity-100"
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
        );
      },
      enableSorting: false,
      size: 80,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            className="-ml-4"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            variant="ghost"
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const track = row.original;
        const isCurrentTrack = currentTrack?.id === track.id;

        return (
          <div className="flex items-center gap-2">
            <div>
              <p
                className={`font-medium ${isCurrentTrack ? 'text-primary' : ''}`}
              >
                {track.name}
              </p>
              {track.versions.length > 1 && (
                <Badge className="mt-1 text-xs" variant="outline">
                  v{track.activeVersion?.version || 1}
                </Badge>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'activeVersion.mimeType',
      header: 'Type',
      cell: ({ row }) => {
        const mimeType = row.original.activeVersion?.mimeType;
        return (
          <Badge className="text-xs" variant="secondary">
            {mimeType ? getFileTypeDisplay(mimeType) : 'Unknown'}
          </Badge>
        );
      },
      size: 80,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            className="-ml-4"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            variant="ghost"
          >
            Date Added
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="text-muted-foreground text-sm">
            {formatDate(row.getValue('createdAt'))}
          </div>
        );
      },
      size: 120,
    },
    {
      accessorKey: 'activeVersion.duration',
      header: ({ column }) => {
        return (
          <div className="text-right">
            <Button
              className="-mr-4"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              variant="ghost"
            >
              Duration
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const duration = row.original.activeVersion?.duration;
        return (
          <div className="text-right text-muted-foreground text-sm">
            {duration ? formatDuration(duration) : '--:--'}
          </div>
        );
      },
      size: 100,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const track = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-8 w-8 p-0" variant="ghost">
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
        );
      },
      enableSorting: false,
      size: 50,
    },
  ];
}
