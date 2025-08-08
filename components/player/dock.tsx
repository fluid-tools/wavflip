'use client'

import { useEffect, useRef, useState } from 'react'
import { useAtom } from 'jotai'
import WaveSurfer from 'wavesurfer.js'
import { generatePlaceholderWaveform } from '@/lib/audio/waveform-generator'
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
    isBufferingAtom,
    isLoadingAtom,
  volumeAtom,
  mutedAtom,
  playerControlsAtom,
  autoPlayAtom
} from '@/state/audio-atoms'
import { waveformCacheAtom } from '@/state/audio-atoms'
import { downloadAndStoreAudio, getTrackFromVault } from '@/lib/storage/local-vault'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'

interface MutableHTMLAudioElement extends HTMLAudioElement {
  _cleanupListeners?: () => void
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function PlayerDock() {
  const desktopWaveformRef = useRef<HTMLDivElement>(null)
  const mobileWaveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const mediaRef = useRef<HTMLAudioElement | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [currentTrack] = useAtom(currentTrackAtom)
  const [currentTime] = useAtom(currentTimeAtom)
  const [duration] = useAtom(durationAtom)
  const [playerState] = useAtom(playerStateAtom)
  const [volume] = useAtom(volumeAtom)
  const [muted] = useAtom(mutedAtom)
  const [autoPlay, setAutoPlay] = useAtom(autoPlayAtom)
  const [isBuffering, setIsBuffering] = useAtom(isBufferingAtom)
  const [isLoading] = useAtom(isLoadingAtom)
  const [, dispatchPlayerAction] = useAtom(playerControlsAtom)
  const [wfCache, setWfCache] = useAtom(waveformCacheAtom)
  
  const isPlaying = playerState === 'playing'
  const isMobile = useIsMobile()

  // Initialize WaveSurfer
  useEffect(() => {
    const container = isMobile ? mobileWaveformRef.current : desktopWaveformRef.current
    if (!container || !currentTrack) return

    // Store current playback state before destroying
    const wasPlaying = wavesurferRef.current?.isPlaying() || false
    const currentProgress = wavesurferRef.current?.getCurrentTime() || 0

    // Immediately pause and clean up previous instance to prevent overlap
    if (wavesurferRef.current) {
      try {
        wavesurferRef.current.pause()
      } catch (error) {
        console.warn('Error pausing previous WaveSurfer instance:', error)
      }
      wavesurferRef.current.destroy()
      wavesurferRef.current = null
    }

    // Load waveform data and initialize WaveSurfer with correct backend (streaming vs offline)
    const loadWaveform = async () => {
      try {
        setIsBuffering(true)
        let monoPeaks: number[] | undefined
        let knownDuration: number | undefined

        // Prefer local vault blob if available
        let playbackUrl = currentTrack.url
        if (!playbackUrl.startsWith('blob:')) {
          try {
            const local = await getTrackFromVault(currentTrack.id)
            if (local?.blobUrl) playbackUrl = local.blobUrl
          } catch {}
        }

        const isBlob = playbackUrl.startsWith('blob:')

        if (isBlob) {
          // Offline: let WebAudio decode; do not fetch /api/waveform
          // We keep peaks optional here; WS will decode & render without peaks.
        } else if (currentTrack.key) {
          // Online: try to reuse already-fetched preview peaks via a global cache first
          const cached = wfCache[currentTrack.key]
          if (cached && cached.length) {
            monoPeaks = cached
          }
          // If no cached peaks, fetch placeholder
          if (!monoPeaks) {
            try {
              const resp = await fetch(`/api/waveform/${encodeURIComponent(currentTrack.key)}`)
              if (resp.ok) {
                const data = await resp.json()
                monoPeaks = data.data.peaks as number[]
                knownDuration = data.data.duration as number
                setWfCache({ ...wfCache, [currentTrack.key]: monoPeaks })
              }
            } catch (e) {
              console.warn('Failed to fetch waveform data:', e)
            }
          }
        }

        if (!monoPeaks && !isBlob) {
          const placeholderDuration = knownDuration ?? currentTrack.duration ?? 30
          monoPeaks = generatePlaceholderWaveform(placeholderDuration).peaks
        }

        if (knownDuration) {
          dispatchPlayerAction({ type: 'SET_DURATION', payload: knownDuration })
        }

        // Backend + media configuration
        const backend: 'WebAudio' | 'MediaElement' = isBlob ? 'WebAudio' : 'MediaElement'
        let media: HTMLAudioElement | undefined

        if (!isBlob) {
          media = document.createElement('audio') as HTMLAudioElement
          media.preload = 'metadata'
          media.crossOrigin = 'anonymous'
          media.src = playbackUrl
          media.load()
          // Buffering-related events
          const handleWaiting = () => setIsBuffering(true)
          const handleStalled = () => setIsBuffering(true)
          const handleCanPlay = () => setIsBuffering(false)
          const handlePlaying = () => setIsBuffering(false)
          const handleEnded = () => {
            setIsBuffering(false);
            dispatchPlayerAction({ type: 'NEXT' });
          }
          media.addEventListener('waiting', handleWaiting)
          media.addEventListener('stalled', handleStalled)
          media.addEventListener('canplay', handleCanPlay)
          media.addEventListener('playing', handlePlaying)
          media.addEventListener('ended', handleEnded)
          media.addEventListener('loadedmetadata', () => {
            const metaDuration = media!.duration
            if (metaDuration && !knownDuration) {
              dispatchPlayerAction({ type: 'SET_DURATION', payload: metaDuration })
            }
          })
          // Cleanup on destroy of WS
          const cleanupMediaListeners = () => {
            media?.removeEventListener('waiting', handleWaiting)
            media?.removeEventListener('stalled', handleStalled)
            media?.removeEventListener('canplay', handleCanPlay)
            media?.removeEventListener('playing', handlePlaying)
            media?.removeEventListener('ended', handleEnded)
          }
          // Attach to instance for later cleanup
          ;(media as MutableHTMLAudioElement)._cleanupListeners = cleanupMediaListeners
          mediaRef.current = media
        }

        const wavesurfer = WaveSurfer.create({
          container,
          height: isMobile ? 48 : 60,
          waveColor: monoPeaks ? 'rgb(64 64 64)' : 'rgb(200 200 200)',
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
          backend,
          splitChannels: undefined,
          peaks: monoPeaks ? [monoPeaks] : undefined,
          duration: knownDuration,
          media,
          // For blob + WebAudio we will pass url to let WS decode/play
          url: isBlob ? playbackUrl : undefined,
        })
        wavesurferRef.current = wavesurfer;
        // Set up event listeners
        wavesurfer.on('ready', () => {
          const trackDuration = wavesurfer.getDuration();
          dispatchPlayerAction({ type: 'SET_DURATION', payload: trackDuration });
          setIsBuffering(false)
          if (currentProgress > 0) {
            wavesurfer.seekTo(currentProgress / trackDuration);
          }
          if (wasPlaying) {
            wavesurfer.play();
          } else if (autoPlay) {
            setAutoPlay(false);
            wavesurfer.play();
          }
        });
        wavesurfer.on('timeupdate', (time: number) => {
          dispatchPlayerAction({ type: 'SET_TIME', payload: time });
        });
        wavesurfer.on('play', () => {
          setIsBuffering(false)
          dispatchPlayerAction({ type: 'PLAY' });
        });
        wavesurfer.on('pause', () => {
          dispatchPlayerAction({ type: 'PAUSE' });
        });
        wavesurfer.on('finish', () => {
          setIsBuffering(false)
          dispatchPlayerAction({ type: 'STOP' });
        });
        wavesurfer.on('error', (error: unknown) => {
          console.error('WaveSurfer error:', error);
        });
        // Set initial volume
        wavesurfer.setVolume(muted ? 0 : volume);
      } catch (e) {
        console.error('Error initializing WaveSurfer:', e);
      }
    };
    loadWaveform();

    return () => {
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.pause()
        } catch (error) {
          console.warn('Error pausing WaveSurfer during cleanup:', error)
        }
        wavesurferRef.current.destroy()
        wavesurferRef.current = null
      }
      // Ensure media event listeners are cleaned up
      try {
        const m = mediaRef.current as MutableHTMLAudioElement | null
        if (m && typeof m._cleanupListeners === 'function') {
          m._cleanupListeners()
        }
        mediaRef.current = null
      } catch {}
      setIsBuffering(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack, dispatchPlayerAction, isMobile])


  // Handle auto-play separately to avoid race conditions
  useEffect(() => {
    if (!wavesurferRef.current || !autoPlay) return

    const wavesurfer = wavesurferRef.current

    // If already ready, play immediately
    if (wavesurfer.getDuration() > 0) {
      setAutoPlay(false)
      wavesurfer.play()
    }
  }, [autoPlay, setAutoPlay])

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
      {/* Desktop Layout */}
      <div className="hidden md:block px-4 sm:px-6 py-3">
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

          {/* Waveform - Takes remaining space with buffering overlay */}
          <div className="flex-1 min-w-0 px-4">
            <div className="relative">
              <div 
                ref={desktopWaveformRef}
                className="w-full h-[60px] rounded-md overflow-hidden bg-neutral-800 border border-neutral-700"
              />
              {(isLoading || isBuffering) && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-neutral-900/30">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
                </div>
              )}
            </div>
          </div>

          {/* Desktop Controls */}
          <div className="flex items-center gap-4 flex-shrink-0">
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
        </div>
      </div>

      {/* Mobile Layout - Compact */}
      <div className="md:hidden">
        {/* Top Row - Track Info and Controls */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Track Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center flex-shrink-0">
                <span className="text-neutral-300 text-sm font-medium">
                  {currentTrack.type === 'generated' ? '🎵' : '📁'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-sm text-neutral-100 truncate">
                  {currentTrack.title}
                </h4>
                <p className="text-xs text-neutral-400 font-mono tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </p>
              </div>
            </div>

            {/* Play Button */}
            <Button
              size="lg"
              onClick={handlePlayPause}
              className="w-12 h-12 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700 hover:border-neutral-600 transition-all duration-200 flex-shrink-0"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
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
        </div>

        {/* Waveform */}
        <div className="px-4 pb-3">
          <div className="relative">
            <div 
              ref={mobileWaveformRef}
              className="w-full h-12 rounded-md overflow-hidden bg-neutral-800 border border-neutral-700"
            />
            {(isLoading || isBuffering) && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-neutral-900/30">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}