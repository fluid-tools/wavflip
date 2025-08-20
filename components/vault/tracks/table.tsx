'use client';

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useAtom } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useProjectTrackUrls } from '@/hooks/data/use-track-url';
import { useIsMobile } from '@/hooks/use-mobile';
import type { ProjectWithTracks } from '@/lib/contracts/project';
import {
  currentTrackAtom,
  isPlayingAtom,
  playerControlsAtom,
} from '@/state/audio-atoms';
import type { AudioTrack } from '@/types/audio';
import {
  type TrackFromProject,
  useTracks,
} from '../../../hooks/data/use-tracks';
import { ProjectPicker } from '../projects/picker';
import { MobileTracksList } from './mobile-list';
import { createTracksTableColumns } from './table-columns';

type TracksTableProps = {
  tracks: TrackFromProject[];
  projectId: string;
  availableProjects?: ProjectWithTracks[];
};

export function TracksTable({
  tracks,
  projectId,
  availableProjects = [],
}: TracksTableProps) {
  const isMobile = useIsMobile();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedTrack, setSelectedTrack] = useState<TrackFromProject | null>(
    null
  );
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [selectedDestinationProjectId, setSelectedDestinationProjectId] =
    useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const [currentTrack] = useAtom(currentTrackAtom);
  const [, dispatchPlayerAction] = useAtom(playerControlsAtom);
  const [isPlaying] = useAtom(isPlayingAtom);

  const {
    deleteTrack,
    renameTrack,
    moveTrack,
    isDeleting,
    isRenaming,
    isMoving,
  } = useTracks({ projectId });

  // Get presigned URLs for all tracks
  useProjectTrackUrls(tracks);

  // Memoize the tracks data to prevent unnecessary re-renders
  const memoizedTracks = useMemo(() => tracks, [tracks]);

  const handlePlayTrack = (track: TrackFromProject) => {
    if (!track.activeVersion) {
      toast.error('No audio version available');
      return;
    }

    // Build streaming URL from S3 key (stored in activeVersion.fileKey)
    const s3Key = track.activeVersion.fileKey;
    if (!s3Key) {
      toast.error('Track file not available');
      return;
    }

    // Always use the /api/audio/[key] proxy route for proper HTTP range request streaming
    // This allows progressive download instead of waiting for the entire file
    const streamingUrl = `/api/audio/${encodeURIComponent(s3Key)}`;

    const audioTrack: AudioTrack = {
      id: track.id,
      title: track.name,
      url: streamingUrl,
      duration: track.activeVersion.duration || undefined,
      createdAt: track.createdAt,
      type: 'uploaded',
      key: track.activeVersion.fileKey,
    };

    dispatchPlayerAction({ type: 'PLAY_TRACK', payload: audioTrack });
  };

  const handleRenameTrack = (track: TrackFromProject) => {
    setSelectedTrack(track);
    setNewName(track.name);
    setShowRenameDialog(true);
  };

  const handleDeleteTrack = (track: TrackFromProject) => {
    setSelectedTrack(track);
    setShowDeleteDialog(true);
  };

  const handleMoveTrack = (track: TrackFromProject) => {
    setSelectedTrack(track);
    setSelectedDestinationProjectId(null);
    setShowMoveDialog(true);
  };

  const handleRename = async () => {
    if (!(selectedTrack && newName.trim())) {
      return;
    }

    await renameTrack(selectedTrack.id, newName.trim());
    setShowRenameDialog(false);
    setSelectedTrack(null);
    setNewName('');
  };

  const handleDelete = async () => {
    if (!selectedTrack) {
      return;
    }

    await deleteTrack(selectedTrack.id);
    setShowDeleteDialog(false);
    setSelectedTrack(null);
  };

  const handleMove = async () => {
    if (!(selectedTrack && selectedDestinationProjectId)) {
      return;
    }

    await moveTrack(selectedTrack.id, selectedDestinationProjectId);
    setShowMoveDialog(false);
    setSelectedTrack(null);
    setSelectedDestinationProjectId(null);
  };

  const columns = createTracksTableColumns({
    currentTrack,
    isPlaying,
    onPlayTrack: handlePlayTrack,
    onRenameTrack: handleRenameTrack,
    onDeleteTrack: handleDeleteTrack,
    onMoveTrack: handleMoveTrack,
    dispatchPlayerAction,
  });

  const table = useReactTable({
    data: memoizedTracks,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  // Debug: Log when tracks prop changes
  useEffect(() => {}, []);

  if (tracks.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-center text-muted-foreground">
        No tracks found.
      </div>
    );
  }

  return (
    <>
      {isMobile ? (
        <MobileTracksList
          onDeleteTrack={handleDeleteTrack}
          onMoveTrack={handleMoveTrack}
          onPlayTrack={handlePlayTrack}
          onRenameTrack={handleRenameTrack}
          tracks={memoizedTracks}
        />
      ) : (
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
                          className="border-0"
                          key={header.id}
                          style={{
                            width: header.getSize(),
                            minWidth: header.getSize(),
                            maxWidth: header.getSize(),
                          }}
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
                      className="group transition-colors odd:bg-background even:bg-muted/20 hover:bg-muted/70"
                      style={style}
                    />
                  );
                },
              }}
              itemContent={(index) => {
                const row = table.getRowModel().rows[index];
                if (!row) {
                  return null;
                }

                return (
                  <>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        className="border-0"
                        key={cell.id}
                        style={{
                          width: cell.column.getSize(),
                          minWidth: cell.column.getSize(),
                          maxWidth: cell.column.getSize(),
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </>
                );
              }}
              style={{ height: '400px' }}
              totalCount={table.getRowModel().rows.length}
            />
          </div>
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog onOpenChange={setShowRenameDialog} open={showRenameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Track</DialogTitle>
            <DialogDescription>
              Enter a new name for this track.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="name">
                Name
              </Label>
              <Input
                autoFocus
                className="col-span-3"
                id="name"
                name="name"
                onChange={(e) => setNewName(e.target.value)}
                required
                value={newName}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={isRenaming}
              onClick={() => setShowRenameDialog(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isRenaming || !newName.trim()}
              onClick={handleRename}
            >
              {isRenaming ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Track</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedTrack?.name}&quot;?
              This will also delete all versions. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={isDeleting}
              onClick={() => setShowDeleteDialog(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isDeleting}
              onClick={handleDelete}
              variant="destructive"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog onOpenChange={setShowMoveDialog} open={showMoveDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Move Track</DialogTitle>
            <DialogDescription>
              Choose which project to move &quot;{selectedTrack?.name}&quot; to.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ProjectPicker
              excludeProjectId={projectId}
              onProjectSelect={setSelectedDestinationProjectId}
              projects={availableProjects}
              selectedProjectId={selectedDestinationProjectId}
            />
          </div>
          <DialogFooter>
            <Button
              disabled={isMoving}
              onClick={() => setShowMoveDialog(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isMoving || !selectedDestinationProjectId}
              onClick={handleMove}
            >
              {isMoving ? 'Moving...' : 'Move'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
