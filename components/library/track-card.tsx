import { useAtom } from 'jotai'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
    <Card className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-card/50 backdrop-blur-sm border-border/40">
      <SoundDetailDialog track={track} onDelete={handleDelete}>
        <div className="cursor-pointer">
          <CardContent className="p-4">
            {/* Audio Icon/Thumbnail Area */}
            <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
              {track.type === 'generated' ? (
                <Music className="h-8 w-8 text-primary/70" />
              ) : (
                <Mic className="h-8 w-8 text-primary/70" />
              )}
              
              {/* Hover Play Button */}
              <Button
                size="sm"
                onClick={handlePlayTrack}
                className="absolute inset-0 m-auto w-10 h-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-primary/90 hover:bg-primary backdrop-blur-sm"
              >
                <Play className="h-4 w-4 text-primary-foreground" />
              </Button>
            </div>

            {/* Track Info */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                {track.title}
              </h3>
              
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs px-2 py-0.5 truncate max-w-[80px]">
                  {track.metadata?.model?.replace('elevenlabs-', '') || 'Unknown'}
                </Badge>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDownloadTrack}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                {new Date(track.createdAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </div>
      </SoundDetailDialog>
    </Card>
  )
} 