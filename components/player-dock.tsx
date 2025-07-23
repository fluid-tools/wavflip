'use client'

import { useEffect, useRef, useState } from 'react'
import { useAtom } from 'jotai'
import WaveSurfer from 'wavesurfer.js'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Download,
  Heart
} from 'lucide-react'
import { 
  currentTrackAtom,
  volumeAtom,
  mutedAtom,
  playerControlsAtom
} from '@/state/audio-atoms'
import { downloadAndStoreAudio } from '@/lib/library-storage'
import { toast } from 'sonner'

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function PlayerDock() {
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  
  const [currentTrack] = useAtom(currentTrackAtom)
  const [volume] = useAtom(volumeAtom)
  const [muted] = useAtom(mutedAtom)
  const [, dispatchPlayerAction] = useAtom(playerControlsAtom)

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current || !currentTrack) return

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      height: 80,
      waveColor: 'rgb(148 163 184)',
      progressColor: 'rgb(59 130 246)',
      cursorColor: 'rgb(59 130 246)',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      fillParent: true,
      interact: true,
      dragToSeek: true,
      normalize: true,
      url: currentTrack.url
    })

    wavesurferRef.current = wavesurfer

    // Set up event listeners
    wavesurfer.on('ready', () => {
      const trackDuration = wavesurfer.getDuration()
      setDuration(trackDuration)
      dispatchPlayerAction({ type: 'SET_DURATION', payload: trackDuration })
    })

    wavesurfer.on('timeupdate', (time) => {
      setCurrentTime(time)
      dispatchPlayerAction({ type: 'SET_TIME', payload: time })
    })

    wavesurfer.on('play', () => {
      setIsPlaying(true)
      dispatchPlayerAction({ type: 'PLAY' })
    })

    wavesurfer.on('pause', () => {
      setIsPlaying(false)
      dispatchPlayerAction({ type: 'PAUSE' })
    })

    wavesurfer.on('finish', () => {
      setIsPlaying(false)
      dispatchPlayerAction({ type: 'STOP' })
    })

    // Set initial volume
    wavesurfer.setVolume(muted ? 0 : volume)

    return () => {
      wavesurfer.destroy()
      wavesurferRef.current = null
    }
  }, [currentTrack, dispatchPlayerAction])

  // Sync volume changes
  useEffect(() => {
    if (!wavesurferRef.current) return
    wavesurferRef.current.setVolume(muted ? 0 : volume)
  }, [volume, muted])

  const handlePlayPause = () => {
    if (!wavesurferRef.current) return
    wavesurferRef.current.playPause()
  }

  const handleVolumeChange = (value: number[]) => {
    dispatchPlayerAction({ type: 'SET_VOLUME', payload: value[0] })
  }

  const handleToggleMute = () => {
    dispatchPlayerAction({ type: 'TOGGLE_MUTE' })
  }

  const handleSaveToLibrary = async () => {
    if (!currentTrack) return
    
    setIsSaving(true)
    try {
      await downloadAndStoreAudio(currentTrack)
      dispatchPlayerAction({ type: 'ADD_TO_LIBRARY', payload: currentTrack })
      toast.success('Track saved to library!')
    } catch (error) {
      console.error('Failed to save track:', error)
      toast.error('Failed to save track to library')
    } finally {
      setIsSaving(false)
    }
  }

  if (!currentTrack) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50 shadow-2xl">
      {/* Waveform Container */}
      <div className="px-4 sm:px-6 pt-4 pb-3">
        <div 
          ref={waveformRef}
          className="w-full rounded-lg overflow-hidden bg-muted/30 ring-1 ring-border/20"
        />
      </div>

      {/* Controls Container */}
      <div className="px-4 sm:px-6 pb-4">
        <div className="flex items-center gap-4">
          {/* Track Info - Responsive */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white text-sm font-medium">
                {currentTrack.type === 'generated' ? '🎵' : '📁'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-sm text-foreground truncate leading-tight">
                {currentTrack.title}
              </h4>
              {currentTrack.metadata?.prompt && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  &ldquo;{currentTrack.metadata.prompt.substring(0, 60)}...&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Play Button - Always Visible */}
          <Button
            size="lg"
            onClick={handlePlayPause}
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex-shrink-0"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          {/* Desktop Controls */}
          <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
            {/* Time Display */}
            <div className="text-xs text-muted-foreground font-mono tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleToggleMute}
                className="w-8 h-8 p-0 hover:bg-muted/50"
              >
                {muted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              
              <div className="w-20">
                <Slider
                  value={[muted ? 0 : volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.01}
                  className="cursor-pointer"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSaveToLibrary}
                disabled={isSaving}
                className="w-8 h-8 p-0 hover:bg-muted/50"
              >
                <Heart className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                asChild
                className="w-8 h-8 p-0 hover:bg-muted/50"
              >
                <a href={currentTrack.url} download>
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex sm:hidden items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleToggleMute}
              className="w-8 h-8 p-0"
            >
              {muted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSaveToLibrary}
              disabled={isSaving}
              className="w-8 h-8 p-0"
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Time Display */}
        <div className="flex sm:hidden justify-center mt-2">
          <div className="text-xs text-muted-foreground font-mono tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>
    </div>
  )
}