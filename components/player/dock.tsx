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
  currentTimeAtom,
  durationAtom,
  playerStateAtom,
  volumeAtom,
  mutedAtom,
  playerControlsAtom,
  autoPlayAtom
} from '@/state/audio-atoms'
import { downloadAndStoreAudio } from '@/lib/storage/local-vault'
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
  const [currentTrack] = useAtom(currentTrackAtom)
  const [currentTime] = useAtom(currentTimeAtom)
  const [duration] = useAtom(durationAtom)
  const [playerState] = useAtom(playerStateAtom)
  const [volume] = useAtom(volumeAtom)
  const [muted] = useAtom(mutedAtom)
  const [autoPlay, setAutoPlay] = useAtom(autoPlayAtom)
  const [, dispatchPlayerAction] = useAtom(playerControlsAtom)
  
  const isPlaying = playerState === 'playing'

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current || !currentTrack) return

    // Clean up previous instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy()
      wavesurferRef.current = null
    }

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      height: 60,
      waveColor: 'rgb(64 64 64)',
      progressColor: 'rgb(255 255 255)',
      cursorColor: 'rgb(255 255 255)',
      cursorWidth: 3,
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
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
      dispatchPlayerAction({ type: 'SET_DURATION', payload: trackDuration })
      
      // Auto-play if requested
      if (autoPlay) {
        setAutoPlay(false)
        // Small delay to ensure everything is ready
        setTimeout(() => {
          wavesurfer.play()
        }, 100)
      }
    })

    // Handle play action when track is already loaded
    if (autoPlay && wavesurfer.getDuration() > 0) {
      setAutoPlay(false)
      setTimeout(() => {
        wavesurfer.play()
      }, 100)
    }

    wavesurfer.on('timeupdate', (time) => {
      dispatchPlayerAction({ type: 'SET_TIME', payload: time })
    })

    wavesurfer.on('play', () => {
      dispatchPlayerAction({ type: 'PLAY' })
    })

    wavesurfer.on('pause', () => {
      dispatchPlayerAction({ type: 'PAUSE' })
    })

    wavesurfer.on('finish', () => {
      dispatchPlayerAction({ type: 'STOP' })
    })

    // Set initial volume
    wavesurfer.setVolume(muted ? 0 : volume)

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy()
        wavesurferRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack, dispatchPlayerAction, autoPlay, setAutoPlay])



  // Sync volume changes
  useEffect(() => {
    if (!wavesurferRef.current) return
    wavesurferRef.current.setVolume(muted ? 0 : volume)
  }, [volume, muted])

  // Handle play state changes
  useEffect(() => {
    if (!wavesurferRef.current || !currentTrack) return
    
    if (playerState === 'playing' && wavesurferRef.current.getDuration() > 0) {
      wavesurferRef.current.play()
    } else if (playerState === 'paused') {
      wavesurferRef.current.pause()
    }
  }, [playerState, currentTrack])

  const handlePlayPause = () => {
    if (!wavesurferRef.current) return
    
    try {
      wavesurferRef.current.playPause()
    } catch (error) {
      console.error('Playback error:', error)
      dispatchPlayerAction({ type: 'ERROR' })
    }
  }

  const handleVolumeChange = (value: number[]) => {
    dispatchPlayerAction({ type: 'SET_VOLUME', payload: value[0] })
  }

  const handleToggleMute = () => {
    dispatchPlayerAction({ type: 'TOGGLE_MUTE' })
  }

  const handleSaveToVault = async () => {
    if (!currentTrack) return
    
    setIsSaving(true)
    try {
      await downloadAndStoreAudio(currentTrack)
      toast.success('Track saved to vault!')
    } catch (error) {
      console.error('Failed to save track:', error)
      toast.error('Failed to save track to vault')
    } finally {
      setIsSaving(false)
    }
  }

  if (!currentTrack) {
    return null
  }

  return (
    <div 
      data-player-dock 
      className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 shadow-2xl">
      <div className="px-4 sm:px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 min-w-0 flex-shrink-0 w-64">
            <div className="w-10 h-10 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center flex-shrink-0">
              <span className="text-neutral-300 text-sm font-medium">
                {currentTrack.type === 'generated' ? '🎵' : '📁'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm text-neutral-100 truncate leading-tight">
                {currentTrack.title}
              </h4>
              {currentTrack.metadata?.prompt && (
                <p className="text-xs text-neutral-400 truncate mt-0.5">
                  &ldquo;{currentTrack.metadata.prompt.substring(0, 40)}...&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Play Button */}
          <Button
            size="lg"
            onClick={handlePlayPause}
            className="w-10 h-10 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700 hover:border-neutral-600 transition-all duration-200 flex-shrink-0"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>

          {/* Waveform - Takes remaining space */}
          <div className="flex-1 min-w-0 px-4">
            <div 
              ref={waveformRef}
              className="w-full rounded-md overflow-hidden bg-neutral-800 border border-neutral-700"
            />
          </div>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            {/* Time Display */}
            <div className="text-xs text-neutral-400 font-mono tabular-nums min-w-[80px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleToggleMute}
                className="w-8 h-8 p-0 hover:bg-neutral-800 text-neutral-300"
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
                  className="cursor-pointer [&_.bg-muted]:bg-neutral-700 [&_.bg-primary]:bg-neutral-300 [&_.border-primary]:border-neutral-300 [&_.bg-background]:bg-neutral-100"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSaveToVault}
                disabled={isSaving}
                className="w-8 h-8 p-0 hover:bg-neutral-800 text-neutral-300"
              >
                <Heart className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                asChild
                className="w-8 h-8 p-0 hover:bg-neutral-800 text-neutral-300"
              >
                <a href={currentTrack.url} download>
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex md:hidden items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleToggleMute}
              className="w-8 h-8 p-0 text-neutral-300 hover:bg-neutral-800"
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
              onClick={handleSaveToVault}
              disabled={isSaving}
              className="w-8 h-8 p-0 text-neutral-300 hover:bg-neutral-800"
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Time Display */}
        <div className="flex md:hidden justify-center mt-2">
          <div className="text-xs text-neutral-400 font-mono tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>
    </div>
  )
}