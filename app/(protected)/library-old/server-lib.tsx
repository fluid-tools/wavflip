'use client'

import { useState } from 'react'
import { useAtom } from 'jotai'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  Play, 
  Download, 
  Music, 
  Mic,
  RefreshCw,
  HardDrive,
  MoreHorizontal
} from 'lucide-react'
import { SoundDetailDialog } from '@/app/(protected)/components/sound-detail-dialog'
import { 
  getLibraryTracks, 
  getLibraryStats,
  createBlobUrlFromAudioData,
  type LibraryTrack 
} from '@/lib/storage/library-storage'
import { 
  playlistAtom, 
  playerControlsAtom 
} from '@/state/audio-atoms'
import { toast } from 'sonner'

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

interface LibraryContentProps {
  initialTracks: LibraryTrack[]
  initialStats: {
    totalTracks: number
    totalSize: number
    generatedTracks: number
    uploadedTracks: number
  }
}

export function LibraryContent({ initialTracks, initialStats }: LibraryContentProps) {
  // Initialize with server data - no flash!
  const [libraryTracks, setLibraryTracks] = useAtom(playlistAtom)
  const [, dispatchPlayerAction] = useAtom(playerControlsAtom)
  const [stats, setStats] = useState(initialStats)

  // Initialize atom with server data if it's empty
  if (libraryTracks.length === 0 && initialTracks.length > 0) {
    setLibraryTracks(initialTracks)
  }

  const loadLibrary = async () => {
    try {
      const tracks = await getLibraryTracks()
      const libraryStats = await getLibraryStats()
      setLibraryTracks(tracks)
      setStats(libraryStats)
    } catch (error) {
      console.error('Failed to load library:', error)
      toast.error('Failed to load library')
    }
  }

  const handlePlayTrack = (track: LibraryTrack) => {
    let playableTrack = track
    
    if (track.audioData) {
      const blobUrl = createBlobUrlFromAudioData(track.audioData)
      playableTrack = { ...track, url: blobUrl }
    }
    
    dispatchPlayerAction({ type: 'PLAY_TRACK', payload: playableTrack })
  }

  const handleDownloadTrack = (track: LibraryTrack) => {
    if (track.audioData) {
      const blobUrl = createBlobUrlFromAudioData(track.audioData)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `${track.title}.mp3`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } else {
      window.open(track.url, '_blank')
    }
  }

  // Use current tracks (either from atom or initial data)
  const currentTracks = libraryTracks.length > 0 ? libraryTracks : initialTracks
  const uniqueLibraryTracks = Array.from(new Map(currentTracks.map(t => [t.id, t])).values())

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{stats.totalTracks}</p>
                <p className="text-xs text-muted-foreground truncate">Total Tracks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold truncate">{formatFileSize(stats.totalSize)}</p>
                <p className="text-xs text-muted-foreground truncate">Storage Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{stats.generatedTracks}</p>
                <p className="text-xs text-muted-foreground truncate">Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{stats.uploadedTracks}</p>
                <p className="text-xs text-muted-foreground truncate">Uploaded</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refresh button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Your Tracks</h2>
        <Button onClick={loadLibrary} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tracks list */}
      {uniqueLibraryTracks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No tracks in library</h3>
            <p className="text-muted-foreground mb-4">
              Generate some sounds to start building your library!
            </p>
            <Button asChild>
              <Link href="/studio">Generate Sounds</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {uniqueLibraryTracks.map((track) => (
            <Card key={`library-${track.id}`} className="hover:shadow-md transition-shadow flex flex-col h-full group">
              <SoundDetailDialog 
                track={track} 
                onDelete={(trackId) => {
                  setLibraryTracks(prev => prev.filter(t => t.id !== trackId))
                  getLibraryStats().then(setStats)
                }}
              >
                <div className="cursor-pointer">
                  <CardHeader className="pb-3 flex-shrink-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm font-medium leading-tight line-clamp-2 mb-1">
                          {track.title}
                        </CardTitle>
                        {track.metadata?.prompt && (
                          <CardDescription className="text-xs mt-1 line-clamp-2 leading-relaxed">
                            &ldquo;{track.metadata.prompt}&rdquo;
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {track.type === 'generated' ? (
                          <Music className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Mic className="h-4 w-4 text-muted-foreground" />
                        )}
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                    <div className="mb-3">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs truncate max-w-[120px]">
                          {track.metadata?.model?.replace('elevenlabs-', '') || 'Unknown'}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(track.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </div>
              </SoundDetailDialog>
              
              {/* Quick Actions */}
              <CardContent className="pt-0 pb-4">
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlayTrack(track)
                    }}
                    className="flex-1 text-xs px-2"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Play
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownloadTrack(track)
                    }}
                    className="px-2"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}