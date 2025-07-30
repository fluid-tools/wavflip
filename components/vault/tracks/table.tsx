'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAtom } from 'jotai'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { TableVirtuoso } from 'react-virtuoso'
import { currentTrackAtom, playerControlsAtom, isPlayingAtom } from '@/state/audio-atoms'
import type { AudioTrack } from '@/types/audio'
import { createTracksTableColumns } from './table-columns'
import { useTracks, type TrackFromProject } from '../../../hooks/use-tracks'
import { ProjectPicker } from '../projects/picker'
import type { ProjectWithTracks } from '@/db/schema/vault'

interface TracksTableProps {
  tracks: TrackFromProject[]
  projectId: string
  availableProjects?: ProjectWithTracks[]
}

export function TracksTable({ tracks, projectId, availableProjects = [] }: TracksTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedTrack, setSelectedTrack] = useState<TrackFromProject | null>(null)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [selectedDestinationProjectId, setSelectedDestinationProjectId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')

  const [currentTrack] = useAtom(currentTrackAtom)
  const [, dispatchPlayerAction] = useAtom(playerControlsAtom)
  const [isPlaying] = useAtom(isPlayingAtom)

  const { deleteTrack, renameTrack, moveTrack, isDeleting, isRenaming, isMoving } = useTracks({ projectId })

  // Memoize the tracks data to prevent unnecessary re-renders
  const memoizedTracks = useMemo(() => tracks, [tracks])

  const handlePlayTrack = (track: TrackFromProject) => {
    if (!track.activeVersion) {
      toast.error('No audio version available')
      return
    }

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

  const handleRenameTrack = (track: TrackFromProject) => {
    setSelectedTrack(track)
    setNewName(track.name)
    setShowRenameDialog(true)
  }

  const handleDeleteTrack = (track: TrackFromProject) => {
    setSelectedTrack(track)
    setShowDeleteDialog(true)
  }

  const handleMoveTrack = (track: TrackFromProject) => {
    setSelectedTrack(track)
    setSelectedDestinationProjectId(null)
    setShowMoveDialog(true)
  }

  const handleRename = async () => {
    if (!selectedTrack || !newName.trim()) return

    await renameTrack(selectedTrack.id, newName.trim())
    setShowRenameDialog(false)
    setSelectedTrack(null)
    setNewName('')
  }

  const handleDelete = async () => {
    if (!selectedTrack) return

    await deleteTrack(selectedTrack.id)
    setShowDeleteDialog(false)
    setSelectedTrack(null)
  }

  const handleMove = async () => {
    if (!selectedTrack || !selectedDestinationProjectId) return

    await moveTrack(selectedTrack.id, selectedDestinationProjectId)
    setShowMoveDialog(false)
    setSelectedTrack(null)
    setSelectedDestinationProjectId(null)
  }

  const columns = createTracksTableColumns({
    currentTrack,
    isPlaying,
    onPlayTrack: handlePlayTrack,
    onRenameTrack: handleRenameTrack,
    onDeleteTrack: handleDeleteTrack,
    onMoveTrack: handleMoveTrack,
    dispatchPlayerAction,
  })

  const table = useReactTable({
    data: memoizedTracks,
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
    console.log('📊 TracksTable tracks updated:', tracks.length, 'tracks')
  }, [tracks])

  if (tracks.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center text-center text-muted-foreground">
        No tracks found.
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <div className="w-full">
          {/* Fixed Header - completely separate from scroll area */}
          <div className="border-b bg-background">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead 
                        key={header.id}
                        style={{ 
                          width: header.getSize(),
                          minWidth: header.getSize(),
                          maxWidth: header.getSize()
                        }}
                        className="border-0"
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
              </TableHeader>
            </Table>
          </div>

          {/* Scrollable Body - only contains rows */}
          <TableVirtuoso
            style={{ height: '400px' }}
            totalCount={table.getRowModel().rows.length}
            components={{
              Table: ({ style, ...props }) => (
                <Table {...props} style={{ ...style, width: '100%' }} />
              ),
              TableBody: ({ style, ...props }) => (
                <TableBody {...props} style={{ ...style }} />
              ),
              TableRow: ({ style, ...props }) => {
                return (
                  <TableRow 
                    {...props} 
                    style={style}
                    className="group hover:bg-muted/70 transition-colors even:bg-muted/20 odd:bg-background"
                  />
                )
              },
            }}
            itemContent={(index) => {
              const row = table.getRowModel().rows[index]
              if (!row) return null
              
              return (
                <>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id}
                      style={{ 
                        width: cell.column.getSize(),
                        minWidth: cell.column.getSize(),
                        maxWidth: cell.column.getSize()
                      }}
                      className="border-0"
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
        </div>
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
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRename} 
              disabled={isRenaming || !newName.trim()}
            >
              {isRenaming ? 'Renaming...' : 'Rename'}
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
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDelete}
              variant="destructive" 
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Move Track</DialogTitle>
            <DialogDescription>
              Choose which project to move &quot;{selectedTrack?.name}&quot; to.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ProjectPicker
              projects={availableProjects}
              selectedProjectId={selectedDestinationProjectId}
              onProjectSelect={setSelectedDestinationProjectId}
              excludeProjectId={projectId}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMoveDialog(false)}
              disabled={isMoving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleMove} 
              disabled={isMoving || !selectedDestinationProjectId}
            >
              {isMoving ? 'Moving...' : 'Move'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 