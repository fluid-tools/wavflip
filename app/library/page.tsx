'use client'

import { useEffect, useState } from 'react'
import { useAtom } from 'jotai'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  Play, 
  Download, 
  Trash2, 
  Music, 
  Mic,
  RefreshCw,
  HardDrive
} from 'lucide-react'
import { 
  getLibraryTracks, 
  removeTrackFromLibrary, 
  getLibraryStats,
  createBlobUrlFromAudioData,
  revokeBlobUrl,
  type LibraryTrack 
} from '@/lib/library-storage'
import { 
  libraryTracksAtom, 
  libraryLoadingAtom, 
  playerControlsAtom 
} from '@/state/audio-atoms'
import { toast } from 'sonner'
import { Loading } from '@/components/loading'
import { AuthGuard } from '@/components/auth-guard'

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function LibraryPage() {
  const [libraryTracks, setLibraryTracks] = useAtom(libraryTracksAtom)
  const [libraryLoading, setLibraryLoading] = useAtom(libraryLoadingAtom)
  const [, dispatchPlayerAction] = useAtom(playerControlsAtom)
  const [stats, setStats] = useState({
    totalTracks: 0,
    totalSize: 0,
    generatedTracks: 0,
    uploadedTracks: 0
  })

  const loadLibrary = async () => {
    setLibraryLoading(true)
    try {
      const tracks = await getLibraryTracks()
      const libraryStats = await getLibraryStats()
      setLibraryTracks(tracks)
      setStats(libraryStats)
    } catch (error) {
      console.error('Failed to load library:', error)
      toast.error('Failed to load library')
    } finally {
      setLibraryLoading(false)
    }
  }

  useEffect(() => {
    loadLibrary()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlayTrack = (track: LibraryTrack) => {
    let playableTrack = track
    
    // If we have local audio data, create a blob URL for playback
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
      revokeBlobUrl(blobUrl)
    } else {
      // Fallback to original URL
      window.open(track.url, '_blank')
    }
  }

  const handleDeleteTrack = async (trackId: string) => {
    try {
      await removeTrackFromLibrary(trackId)
      setLibraryTracks(prev => prev.filter(track => track.id !== trackId))
      toast.success('Track removed from library')
      
      // Update stats
      const newStats = await getLibraryStats()
      setStats(newStats)
    } catch (error) {
      console.error('Failed to delete track:', error)
      toast.error('Failed to remove track')
    }
  }

  if (libraryLoading) {
    return (
      <AuthGuard>
        <main className="container mx-auto px-4 py-6 pb-24 max-w-7xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Library</h1>
            <p className="text-muted-foreground">Your saved audio tracks</p>
          </div>
          <Loading text="Loading library..." className="py-12" />
        </main>
      </AuthGuard>
    )
  }

  // Dedupe tracks by id before rendering
  const uniqueLibraryTracks = Array.from(new Map(libraryTracks.map(t => [t.id, t])).values())

  return (
    <AuthGuard>
      <main className="container mx-auto px-4 py-6 pb-24 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Library</h1>
          <p className="text-muted-foreground">Your saved audio tracks</p>
        </div>

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
      {libraryTracks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No tracks in library</h3>
            <p className="text-muted-foreground mb-4">
              Generate some sounds to start building your library!
            </p>
            <Button asChild>
              <Link href="/">Generate Sounds</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {uniqueLibraryTracks.map((track) => (
            <Card key={`library-${track.id}`} className="hover:shadow-md transition-shadow flex flex-col h-full">
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
                  <div className="flex-shrink-0">
                    {track.type === 'generated' ? (
                      <Music className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Mic className="h-4 w-4 text-muted-foreground" />
                    )}
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
                
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    onClick={() => handlePlayTrack(track)}
                    className="flex-1 text-xs px-2"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Play
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadTrack(track)}
                    className="px-2"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteTrack(track.id)}
                    className="px-2"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </main>
    </AuthGuard>
  )
} 