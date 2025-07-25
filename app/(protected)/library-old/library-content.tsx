'use client'

import { useState, useEffect } from 'react'
import { VirtuosoGrid } from 'react-virtuoso'
import { RefreshCw, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { LibraryStats } from '@/components/library/old/library-stats-old'
import { TrackCard } from '@/components/library/old/track-card-old'
import { LibraryLoading } from '@/components/library/old/library-loading-old'
import { getLibraryTracks, getLibraryStats, removeTrackFromLibrary } from '@/lib/storage/library-storage'
import type { LibraryTrack, LibraryStats as LibraryStatsType } from '@/lib/storage/library-storage'

function useLibrary() {
  const [tracks, setTracks] = useState<LibraryTrack[]>([])
  const [stats, setStats] = useState<LibraryStatsType>({
    totalTracks: 0,
    totalSize: 0,
    totalDuration: 0,
    generatedTracks: 0,
    uploadedTracks: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)

  const loadLibrary = async () => {
    try {
      setIsLoading(true)
      const [libraryTracks, libraryStats] = await Promise.all([
        getLibraryTracks(),
        getLibraryStats()
      ])
      setTracks(libraryTracks)
      setStats(libraryStats)
    } catch (error) {
      console.error('Failed to load library:', error)
      toast.error('Failed to load library')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTrack = async (trackId: string) => {
    try {
      await removeTrackFromLibrary(trackId)
      setTracks(prev => prev.filter(track => track.id !== trackId))
      setStats(prev => ({
        ...prev,
        totalTracks: prev.totalTracks - 1
      }))
      toast.success('Track removed from library')
    } catch (error) {
      console.error('Failed to delete track:', error)
      toast.error('Failed to remove track')
    }
  }

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (hasMounted) {
      loadLibrary()
    }
  }, [hasMounted])

  return {
    tracks,
    stats,
    isLoading: isLoading || !hasMounted,
    loadLibrary,
    deleteTrack
  }
}

export function LibraryContent() {
  const { tracks, stats, isLoading, loadLibrary, deleteTrack } = useLibrary()

  if (isLoading) {
    return <LibraryLoading />
  }

  const isEmpty = tracks.length === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Your Library</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={loadLibrary}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <LibraryStats stats={stats} />

      {/* Tracks */}
      {isEmpty ? (
        <div className="text-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-muted p-3">
              <Music className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No tracks yet</h3>
              <p className="text-muted-foreground">
                Generate or upload audio tracks to see them here
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[600px]">
          <VirtuosoGrid
            totalCount={tracks.length}
            itemContent={(index: number) => (
              <TrackCard
                track={tracks[index]}
                onDelete={() => deleteTrack(tracks[index].id)}
              />
            )}
            listClassName="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 py-4"
            style={{ height: '100%' }}
          />
        </div>
      )}
    </div>
  )
}