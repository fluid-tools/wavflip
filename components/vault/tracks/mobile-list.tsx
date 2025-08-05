'use client'

import { useState } from 'react'
import { useAtom } from 'jotai'
import { Virtuoso } from 'react-virtuoso'
import { Play, Pause, MoreHorizontal, Edit2, Trash2, Upload, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { currentTrackAtom, playerControlsAtom, isPlayingAtom } from '@/state/audio-atoms'
import type { TrackFromProject } from '../../../hooks/data/use-tracks'
import type { ProjectWithTracks } from '@/db/schema/vault'
import { cn } from '@/lib/utils'

interface MobileTracksListProps {
  tracks: TrackFromProject[]
  projectId: string
  availableProjects?: ProjectWithTracks[]
  onPlayTrack: (track: TrackFromProject) => void
  onRenameTrack: (track: TrackFromProject) => void
  onDeleteTrack: (track: TrackFromProject) => void
  onMoveTrack: (track: TrackFromProject) => void
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
  
  return typeMap[mimeType] || 'UNKNOWN'
}

export function MobileTracksList({ 
  tracks, 
  projectId, 
  availableProjects = [],
  onPlayTrack,
  onRenameTrack,
  onDeleteTrack,
  onMoveTrack
}: MobileTracksListProps) {
  const [currentTrack] = useAtom(currentTrackAtom)
  const [, dispatchPlayerAction] = useAtom(playerControlsAtom)
  const [isPlaying] = useAtom(isPlayingAtom)

  return (
    <div className="border rounded-lg overflow-hidden">
      <Virtuoso
        style={{ height: '400px' }}
        totalCount={tracks.length}
        itemContent={(index) => {
          const track = tracks[index]
          const isCurrentTrack = currentTrack?.id === track.id
          const isTrackPlaying = isCurrentTrack && isPlaying
          const duration = track.activeVersion?.duration
          const mimeType = track.activeVersion?.mimeType

          return (
            <div
              className={cn(
                "flex items-center gap-3 p-3 border-b border-border/50 last:border-b-0 bg-background transition-colors hover:bg-muted/50",
                isCurrentTrack && "bg-primary/5"
              )}
            >
            {/* Track Number / Play Button */}
            <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => {
                  if (isTrackPlaying) {
                    dispatchPlayerAction({ type: 'PAUSE' })
                  } else if (isCurrentTrack) {
                    dispatchPlayerAction({ type: 'PLAY' })
                  } else {
                    onPlayTrack(track)
                  }
                }}
              >
                {isTrackPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={cn(
                  "font-medium text-sm truncate",
                  isCurrentTrack && "text-primary"
                )}>
                  {track.name}
                </h3>
                {track.versions.length > 1 && (
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    v{track.activeVersion?.version || 1}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="truncate">
                  {formatDate(track.createdAt)}
                </span>
                <span>•</span>
                <Badge variant="secondary" className="text-xs">
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
                <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onRenameTrack(track)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMoveTrack(track)}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Move to Project
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
          </div>
        )
      }}
    />
    </div>
  )
}