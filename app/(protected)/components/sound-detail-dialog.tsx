"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useAtom } from 'jotai'
import { playerControlsAtom } from '@/state/audio-atoms'
import { 
  Play, 
  Download, 
  Trash2, 
  Music, 
  Mic, 
  Calendar,
  Clock,
  Tag,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  removeTrackFromLibrary, 
  createBlobUrlFromAudioData, 
  revokeBlobUrl,
  type LibraryTrack 
} from '@/lib/storage/library-storage'

interface SoundDetailDialogProps {
  track: LibraryTrack
  children: React.ReactNode
  onDelete?: (trackId: string) => void
}

export function SoundDetailDialog({ track, children, onDelete }: SoundDetailDialogProps) {
  const [open, setOpen] = useState(false)
  const [, dispatchPlayerAction] = useAtom(playerControlsAtom)

  const handlePlayTrack = () => {
    let playableTrack = track
    
    if (track.audioData) {
      const blobUrl = createBlobUrlFromAudioData(track.audioData)
      playableTrack = { ...track, url: blobUrl }
    }
    
    dispatchPlayerAction({ type: 'PLAY_TRACK', payload: playableTrack })
  }

  const handleDownloadTrack = () => {
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
      window.open(track.url, '_blank')
    }
  }

  const handleDeleteTrack = async () => {
    try {
      await removeTrackFromLibrary(track.id)
      onDelete?.(track.id)
      setOpen(false)
      toast.success('Track removed from library')
    } catch (error) {
      console.error('Failed to delete track:', error)
      toast.error('Failed to remove track')
    }
  }



  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {track.type === 'generated' ? (
              <Music className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
            {track.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Actions */}
          <div className="flex items-center gap-3">
            <Button onClick={handlePlayTrack} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              Play Track
            </Button>
            <Button variant="outline" onClick={handleDownloadTrack}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="destructive" onClick={handleDeleteTrack}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>

          {/* Track Info */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Track Information
                </h3>
                <Badge variant={track.type === 'generated' ? 'default' : 'secondary'}>
                  {track.type === 'generated' ? 'Generated' : 'Uploaded'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(track.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {track.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Duration</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDuration(track.duration)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {track.metadata?.model && (
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Model</p>
                        <Badge variant="outline" className="text-xs">
                          {track.metadata.model.replace('elevenlabs-', '')}
                        </Badge>
                      </div>
                    </div>
                  )}


                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prompt/Description */}
          {track.metadata?.prompt && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">
                  {track.type === 'generated' ? 'Generation Prompt' : 'Description'}
                </h3>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm leading-relaxed">
                    &ldquo;{track.metadata.prompt}&rdquo;
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Metadata */}
          {track.metadata?.voice && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Generation Settings</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Voice:</span>
                    <span className="text-sm font-medium">{track.metadata.voice}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}