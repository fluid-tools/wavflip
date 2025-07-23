import { useAtom } from 'jotai'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, Download, Music, Mic, MoreHorizontal } from 'lucide-react'
import { SoundDetailDialog } from '@/app/(protected)/components/sound-detail-dialog'
import { createBlobUrlFromAudioData, type LibraryTrack } from '@/lib/storage/library-storage'
import { playerControlsAtom } from '@/state/audio-atoms'

interface TrackCardProps {
  track: LibraryTrack
  onDelete: (trackId: string) => void
}

export function TrackCard({ track, onDelete }: TrackCardProps) {
  const [, dispatchPlayerAction] = useAtom(playerControlsAtom)

  const handlePlayTrack = (e: React.MouseEvent) => {
    e.stopPropagation()
    let playableTrack = track
    
    if (track.audioData) {
      const blobUrl = createBlobUrlFromAudioData(track.audioData)
      playableTrack = { ...track, url: blobUrl }
    }
    
    dispatchPlayerAction({ type: 'PLAY_TRACK', payload: playableTrack })
  }

  const handleDownloadTrack = (e: React.MouseEvent) => {
    e.stopPropagation()
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

  const handleDelete = (trackId: string) => {
    onDelete(trackId)
  }

  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col h-full group">
      <SoundDetailDialog track={track} onDelete={handleDelete}>
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
            onClick={handlePlayTrack}
            className="flex-1 text-xs px-2"
          >
            <Play className="h-3 w-3 mr-1" />
            Play
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadTrack}
            className="px-2"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 