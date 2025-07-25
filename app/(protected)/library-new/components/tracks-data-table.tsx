'use client'

import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, Play, Pause, MoreHorizontal, Edit2, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { currentTrackAtom, playerControlsAtom, isPlayingAtom } from '@/state/audio-atoms'
import type { ProjectWithTracks } from '@/db/schema/library'
import type { AudioTrack } from '@/types/audio'
import { TableVirtuoso } from 'react-virtuoso'

type TrackFromProject = ProjectWithTracks['tracks'][0]

interface TracksDataTableProps {
  tracks: TrackFromProject[]
  projectId: string
}

export function TracksDataTable({ tracks, projectId }: TracksDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedTrack, setSelectedTrack] = useState<TrackFromProject | null>(null)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newName, setNewName] = useState('')

  const [currentTrack] = useAtom(currentTrackAtom)
  const [, dispatchPlayerAction] = useAtom(playerControlsAtom)
  const [isPlaying] = useAtom(isPlayingAtom)

  const queryClient = useQueryClient()
  const queryKey = ['project', projectId]

  // Delete track mutation with optimistic updates
  const deleteTrackMutation = useMutation({
    mutationFn: async (trackId: string) => {
      const formData = new FormData()
      formData.append('trackId', trackId)
      formData.append('projectId', projectId)

      const response = await fetch('/api/tracks', {
        method: 'DELETE',
        body: formData
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      return response.json()
    },
    onMutate: async (trackId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousProject = queryClient.getQueryData<ProjectWithTracks>(queryKey)
      console.log('🗑️ DELETE onMutate - before:', previousProject?.tracks.length, 'tracks')

      // Optimistically remove the track
      if (previousProject) {
        const updatedTracks = previousProject.tracks.filter(track => track.id !== trackId)
        console.log('🗑️ DELETE onMutate - after filter:', updatedTracks.length, 'tracks')
        queryClient.setQueryData<ProjectWithTracks>(queryKey, {
          ...previousProject,
          tracks: updatedTracks
        })
        console.log('🗑️ DELETE onMutate - cache updated')
      }

      return { previousProject, trackId }
    },
    onError: (error, trackId, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(queryKey, context.previousProject)
      }
      toast.error(`Failed to delete track: ${error.message}`)
    },
    onSuccess: () => {
      toast.success('Track deleted successfully')
      // Invalidate to ensure we have the latest server state
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Rename track mutation with optimistic updates
  const renameTrackMutation = useMutation({
    mutationFn: async ({ trackId, newName }: { trackId: string; newName: string }) => {
      const formData = new FormData()
      formData.append('trackId', trackId)
      formData.append('name', newName)
      formData.append('projectId', projectId)

      const response = await fetch('/api/tracks', {
        method: 'PATCH',
        body: formData
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      return response.json()
    },
    onMutate: async ({ trackId, newName }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousProject = queryClient.getQueryData<ProjectWithTracks>(queryKey)

      // Optimistically update the track name
      if (previousProject) {
        const updatedTracks = previousProject.tracks.map(track => 
          track.id === trackId 
            ? { ...track, name: newName.trim(), updatedAt: new Date() }
            : track
        )
        queryClient.setQueryData<ProjectWithTracks>(queryKey, {
          ...previousProject,
          tracks: updatedTracks
        })
      }

      return { previousProject, trackId }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(queryKey, context.previousProject)
      }
      toast.error(`Failed to rename track: ${error.message}`)
    },
    onSuccess: () => {
      toast.success('Track renamed successfully')
      // Invalidate to ensure we have the latest server state
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const handlePlayTrack = (track: TrackFromProject) => {
    if (!track.activeVersion) {
      toast.error('No audio version available')
      return
    }

    // Convert to AudioTrack format expected by player
    const audioTrack: AudioTrack = {
      id: track.id,
      title: track.name,
      url: track.activeVersion.fileUrl,
      duration: track.activeVersion.duration || undefined,
      createdAt: track.createdAt,
      type: 'uploaded'
    }

    dispatchPlayerAction({ type: 'PLAY_TRACK', payload: audioTrack })
  }

  const handleRename = async () => {
    if (!selectedTrack || !newName.trim()) return

    try {
      await renameTrackMutation.mutateAsync({ 
        trackId: selectedTrack.id, 
        newName: newName.trim() 
      })
      setShowRenameDialog(false)
      setSelectedTrack(null)
      setNewName('')
    } catch {
      // Error handled by mutation
    }
  }

  const handleDelete = async () => {
    if (!selectedTrack) return

    try {
      await deleteTrackMutation.mutateAsync(selectedTrack.id)
      setShowDeleteDialog(false)
      setSelectedTrack(null)
    } catch {
      // Error handled by mutation
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '--'
    
    const dateObj = date instanceof Date ? date : new Date(date)
    
    // Check if date is valid
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

  const columns: ColumnDef<TrackFromProject>[] = [
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
                  handlePlayTrack(track)
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
              <DropdownMenuItem
                onClick={() => {
                  setSelectedTrack(track)
                  setNewName(track.name)
                  setShowRenameDialog(true)
                }}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="h-4 w-4 mr-2" />
                Upload New Version
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedTrack(track)
                  setShowDeleteDialog(true)
                }}
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

  const table = useReactTable({
    data: [...tracks], // Force new reference for React Table
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  // Debug: Log when tracks prop changes
  useEffect(() => {
    console.log('📊 TracksDataTable tracks updated:', tracks.length, 'tracks')
  }, [tracks])

  return (
    <>
      <div className="rounded-md border">
        <TableVirtuoso
          style={{ height: '400px' }}
          totalCount={table.getRowModel().rows.length}
          components={{
            Table: ({ style, ...props }) => (
              <Table {...props} style={{ ...style, width: '100%' }} />
            ),
            TableHead: TableHeader,
            TableRow: ({ ...props }) => (
              <TableRow
                {...props}
                className="group hover:bg-muted/50"
              />
            ),
            TableBody: ({ style, ...props }) => (
              <TableBody {...props} style={{ ...style }} />
            ),
          }}
          fixedHeaderContent={() => (
            <>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead 
                      key={header.id}
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </>
          )}
          itemContent={(index) => {
            const row = table.getRowModel().rows[index]
            if (!row) return null
            
            return (
              <>
                {row.getVisibleCells().map((cell) => (
                  <TableCell 
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </>
            )
          }}
        />
        {tracks.length === 0 && (
          <div className="h-24 flex items-center justify-center text-center text-muted-foreground">
            No tracks found.
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Track</DialogTitle>
            <DialogDescription>
              Enter a new name for this track.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3"
                autoFocus
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRenameDialog(false)}
              disabled={renameTrackMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRename} 
              disabled={renameTrackMutation.isPending || !newName.trim()}
            >
              {renameTrackMutation.isPending ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Track</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedTrack?.name}&quot;? This will also delete all versions. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteTrackMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDelete}
              variant="destructive" 
              disabled={deleteTrackMutation.isPending}
            >
              {deleteTrackMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 