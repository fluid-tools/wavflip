'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Play, Pause, MoreHorizontal, Edit2, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { AudioTrack } from '@/types/audio'
import type { PlayerAction } from '@/state/audio-atoms'
import type { TrackFromProject } from '../../hooks/use-tracks'

interface ColumnActionsProps {
  track: TrackFromProject
  currentTrack: AudioTrack | null
  isPlaying: boolean
  onPlayTrack: (track: TrackFromProject) => void
  onRenameTrack: (track: TrackFromProject) => void
  onDeleteTrack: (track: TrackFromProject) => void
  dispatchPlayerAction: (action: PlayerAction) => void
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return '--'
  
  const dateObj = date instanceof Date ? date : new Date(date)
  
  if (isNaN(dateObj.getTime())) {
    return '--'
  }
  
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  }).format(dateObj)
}

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
    'audio/amr': 'AMR'
  }
  
  return typeMap[mimeType] || 'Audio'
}

export function createTracksTableColumns({
  currentTrack,
  isPlaying,
  onPlayTrack,
  onRenameTrack,
  onDeleteTrack,
  dispatchPlayerAction,
}: Omit<ColumnActionsProps, 'track'>): ColumnDef<TrackFromProject>[] {
  return [
    {
      id: 'play',
      header: '#',
      cell: ({ row, table }) => {
        const track = row.original
        const index = table.getSortedRowModel().rows.findIndex(r => r.id === row.id)
        const isCurrentTrack = currentTrack?.id === track.id
        const actuallyPlaying = isCurrentTrack && isPlaying

        return (
          <div className="flex items-center justify-center w-8 h-8 group">
            <span className="text-sm text-muted-foreground group-hover:hidden">
              {index + 1}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 hidden group-hover:flex opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                if (actuallyPlaying) {
                  dispatchPlayerAction({ type: 'PAUSE' })
                } else if (isCurrentTrack) {
                  dispatchPlayerAction({ type: 'PLAY' })
                } else {
                  onPlayTrack(track)
                }
              }}
            >
              {actuallyPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </div>
        )
      },
      enableSorting: false,
      size: 80,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const track = row.original
        const isCurrentTrack = currentTrack?.id === track.id
        
        return (
          <div className="flex items-center gap-2">
            <div>
              <p className={`font-medium ${isCurrentTrack ? 'text-primary' : ''}`}>
                {track.name}
              </p>
              {track.versions.length > 1 && (
                <Badge variant="outline" className="text-xs mt-1">
                  v{track.activeVersion?.version || 1}
                </Badge>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'activeVersion.mimeType',
      header: 'Type',
      cell: ({ row }) => {
        const mimeType = row.original.activeVersion?.mimeType
        return (
          <Badge variant="secondary" className="text-xs">
            {mimeType ? getFileTypeDisplay(mimeType) : 'Unknown'}
          </Badge>
        )
      },
      size: 80,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Date Added
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return (
          <div className="text-sm text-muted-foreground">
            {formatDate(row.getValue('createdAt'))}
          </div>
        )
      },
      size: 120,
    },
    {
      accessorKey: 'activeVersion.duration',
      header: ({ column }) => {
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="-mr-4"
            >
              Duration
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const duration = row.original.activeVersion?.duration
        return (
          <div className="text-right text-sm text-muted-foreground">
            {duration ? formatDuration(duration) : '--:--'}
          </div>
        )
      },
      size: 100,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const track = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onRenameTrack(track)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="h-4 w-4 mr-2" />
                Upload New Version
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDeleteTrack(track)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
      size: 50,
    },
  ]
} 