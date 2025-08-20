'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { Download, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import WaveSurfer from 'wavesurfer.js';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { vaultKeys } from '@/hooks/data/keys';
import { useWaveform } from '@/hooks/data/use-waveform';
import { useIsMobile } from '@/hooks/use-mobile';
import { generatePlaceholderWaveform } from '@/lib/audio/waveform-generator';
import {
  downloadAndStoreAudio,
  getTrackFromVault,
} from '@/lib/storage/local-vault';
import {
  autoPlayAtom,
  currentTimeAtom,
  currentTrackAtom,
  durationAtom,
  isBufferingAtom,
  isLoadingAtom,
  mutedAtom,
  playerControlsAtom,
  playerStateAtom,
  volumeAtom,
} from '@/state/audio-atoms';

interface MutableHTMLAudioElement extends HTMLAudioElement {
  _cleanupListeners?: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function PlayerDock() {
  const desktopWaveformRef = useRef<HTMLDivElement>(null);
  const mobileWaveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const mediaRef = useRef<HTMLAudioElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isActuallyPlaying, setIsActuallyPlaying] = useState(false);
  const [currentTrack] = useAtom(currentTrackAtom);
  const [currentTime] = useAtom(currentTimeAtom);
  const [duration] = useAtom(durationAtom);
  const [playerState] = useAtom(playerStateAtom);
  const [volume] = useAtom(volumeAtom);
  const [muted] = useAtom(mutedAtom);
  const [autoPlay, setAutoPlay] = useAtom(autoPlayAtom);
  const [isBuffering, setIsBuffering] = useAtom(isBufferingAtom);
  const [isLoading] = useAtom(isLoadingAtom);
  const [, dispatchPlayerAction] = useAtom(playerControlsAtom);
  const wf = useWaveform(currentTrack?.key);

  const isPlaying = isActuallyPlaying;
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Initialize WaveSurfer
  useEffect(() => {
    const container = isMobile
      ? mobileWaveformRef.current
      : desktopWaveformRef.current;
    if (!(container && currentTrack)) {
      return;
    }

    // Store current playback state before destroying
    const wasPlaying = wavesurferRef.current?.isPlaying();
    const currentProgress = wavesurferRef.current?.getCurrentTime() || 0;

    // Immediately pause and clean up previous instance to prevent overlap
    if (wavesurferRef.current) {
      try {
        wavesurferRef.current.pause();
      } catch {}
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }

    // Load waveform data and initialize WaveSurfer with correct backend (streaming vs offline)
    const loadWaveform = async () => {
      try {
        setIsBuffering(true);
        let monoPeaks: number[] | undefined;
        let knownDuration: number | undefined;

        // Prefer local vault OPFS-backed blob if available; otherwise stream via /api/audio/[key]
        let playbackUrl = currentTrack.url;
        try {
          const local =
            (await getTrackFromVault(currentTrack.id)) ||
            (currentTrack.key
              ? await getTrackFromVault(currentTrack.key)
              : null);
          if (local?.blobUrl) {
            playbackUrl = local.blobUrl;
          } else if (currentTrack.key) {
            playbackUrl = `/api/audio/${encodeURIComponent(currentTrack.key)}`;
          }
        } catch {}

        const isBlob = playbackUrl.startsWith('blob:');

        if (isBlob) {
          // Offline: compute peaks locally from stored audio data if available
          try {
            const local = await getTrackFromVault(currentTrack.id);
            if (local?.audioData) {
              const { generateWaveformData } = await import(
                '@/lib/audio/waveform-generator'
              );
              const wf = await generateWaveformData(local.audioData);
              monoPeaks = wf.peaks;
              knownDuration = wf.duration;
            }
          } catch {}
        } else if (currentTrack.key) {
          const data = wf.data;
          if (data?.peaks?.length) {
            monoPeaks = data.peaks;
            knownDuration = data.duration;
          }
        }

        if (!(monoPeaks || isBlob)) {
          const placeholderDuration =
            knownDuration ?? currentTrack.duration ?? 30;
          monoPeaks = generatePlaceholderWaveform(placeholderDuration).peaks;
        }

        if (knownDuration) {
          dispatchPlayerAction({
            type: 'SET_DURATION',
            payload: knownDuration,
          });
        }

        // Backend + media configuration
        // Use MediaElement for both streaming and blob to avoid fetch(blob) issues in WS
        const backend: 'WebAudio' | 'MediaElement' = 'MediaElement';
        let media: HTMLAudioElement | undefined;

        {
          // Always drive playback via a media element (works for both blob and streaming)
          media = document.createElement('audio') as HTMLAudioElement;
          media.preload = 'metadata';
          if (playbackUrl.startsWith('http')) {
            media.crossOrigin = 'anonymous';
          } else {
            // Remove CORS attribute for blob: URLs to avoid security errors
            try {
              media.removeAttribute('crossorigin');
            } catch {}
          }
          media.src = playbackUrl;
          media.load();
          // Buffering-related events
          const handleWaiting = () => setIsBuffering(true);
          const handleStalled = () => setIsBuffering(true);
          const handleCanPlay = () => setIsBuffering(false);
          const handlePlaying = () => {
            setIsBuffering(false);
            setIsActuallyPlaying(true);
          };
          const handleError = async () => {
            // MediaError is not used, but we check for its existence
            const hasError = media && (media as HTMLMediaElement).error;
            setIsActuallyPlaying(false);
            // Fallback chain:
            // 1) If blob failed and we have a key, load from OPFS again to refresh blob URL
            // 2) If still failing, and online, stream via /api/audio/[key]
            if (currentTrack.key) {
              try {
                const refreshed = await getTrackFromVault(currentTrack.id);
                if (refreshed?.blobUrl) {
                  media.src = refreshed.blobUrl;
                  media.load();
                  return;
                }
              } catch {}
              if (typeof navigator !== 'undefined' && navigator.onLine) {
                try {
                  media.src = `/api/audio/${encodeURIComponent(currentTrack.key)}`;
                  media.load();
                  return;
                } catch {}
              }
            }
            setIsBuffering(false);
          };
          const handleEnded = () => {
            setIsBuffering(false);
            setIsActuallyPlaying(false);
            dispatchPlayerAction({ type: 'NEXT' });
          };
          media.addEventListener('waiting', handleWaiting);
          media.addEventListener('stalled', handleStalled);
          media.addEventListener('canplay', handleCanPlay);
          media.addEventListener('playing', handlePlaying);
          media.addEventListener('ended', handleEnded);
          media.addEventListener('loadedmetadata', () => {
            const metaDuration = media?.duration;
            if (metaDuration && !knownDuration) {
              dispatchPlayerAction({
                type: 'SET_DURATION',
                payload: metaDuration,
              });
            }
          });
          media.addEventListener('error', handleError);
          // Cleanup on destroy of WS
          const cleanupMediaListeners = () => {
            media?.removeEventListener('waiting', handleWaiting);
            media?.removeEventListener('stalled', handleStalled);
            media?.removeEventListener('canplay', handleCanPlay);
            media?.removeEventListener('playing', handlePlaying);
            media?.removeEventListener('ended', handleEnded);
            media?.removeEventListener('error', handleError);
          };
          // Attach to instance for later cleanup
          (media as MutableHTMLAudioElement)._cleanupListeners =
            cleanupMediaListeners;
          mediaRef.current = media;
        }

        const wavesurfer = WaveSurfer.create({
          container,
          height: isMobile ? 44 : 56,
          waveColor: monoPeaks
            ? 'rgba(148,163,184,0.55)'
            : 'rgba(203,213,225,0.6)',
          progressColor: 'rgba(255,255,255,0.9)',
          cursorColor: 'rgba(255,255,255,0.7)',
          cursorWidth: 1.5,
          fillParent: true,
          interact: true,
          dragToSeek: true,
          normalize: true,
          backend,
          splitChannels: undefined,
          peaks: monoPeaks ? [monoPeaks] : undefined,
          duration: knownDuration,
          media,
          // MediaElement is supplied, we don't need url
          url: undefined,
        });
        wavesurferRef.current = wavesurfer;
        // Set up event listeners
        wavesurfer.on('ready', () => {
          const trackDuration = wavesurfer.getDuration();
          dispatchPlayerAction({
            type: 'SET_DURATION',
            payload: trackDuration,
          });
          setIsBuffering(false);
          if (currentProgress > 0) {
            wavesurfer.seekTo(currentProgress / trackDuration);
          }
          const shouldAutoPlay = wasPlaying || autoPlay;
          if (shouldAutoPlay) {
            setAutoPlay(false);
            // Ensure media is interactable before play
            const tryPlay = async () => {
              try {
                await wavesurfer.play();
              } catch {
                // As a fallback, toggle play/pause quickly to kick-start
                try {
                  await wavesurfer.pause();
                  await wavesurfer.play();
                } catch {}
              }
            };
            void tryPlay();
          }
        });
        wavesurfer.on('timeupdate', (time: number) => {
          dispatchPlayerAction({ type: 'SET_TIME', payload: time });
        });
        wavesurfer.on('play', () => {
          setIsBuffering(false);
          setIsActuallyPlaying(true);
          dispatchPlayerAction({ type: 'PLAY' });
        });
        wavesurfer.on('pause', () => {
          setIsActuallyPlaying(false);
          dispatchPlayerAction({ type: 'PAUSE' });
        });
        wavesurfer.on('finish', () => {
          setIsBuffering(false);
          setIsActuallyPlaying(false);
          dispatchPlayerAction({ type: 'STOP' });
        });
        wavesurfer.on('error', () => {});
        // Set initial volume
        wavesurfer.setVolume(muted ? 0 : volume);
      } catch {}
    };
    loadWaveform();

    return () => {
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.pause();
        } catch {}
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
      // Ensure media event listeners are cleaned up
      try {
        const m = mediaRef.current as MutableHTMLAudioElement | null;
        if (m && typeof m._cleanupListeners === 'function') {
          m._cleanupListeners();
        }
        mediaRef.current = null;
      } catch {}
      setIsBuffering(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentTrack,
    dispatchPlayerAction,
    isMobile,
    autoPlay,
    muted,
    setAutoPlay,
    setIsBuffering,
    volume,
    wf.data,
  ]);

  // Handle auto-play separately to avoid race conditions
  useEffect(() => {
    if (!(wavesurferRef.current && autoPlay)) {
      return;
    }

    const wavesurfer = wavesurferRef.current;

    // If already ready, play immediately
    if (wavesurfer.getDuration() > 0) {
      setAutoPlay(false);
      wavesurfer.play();
    }
  }, [autoPlay, setAutoPlay]);

  // Sync volume changes
  useEffect(() => {
    if (!wavesurferRef.current) {
      return;
    }
    wavesurferRef.current.setVolume(muted ? 0 : volume);
  }, [volume, muted]);

  // Handle play state changes
  useEffect(() => {
    if (!(wavesurferRef.current && currentTrack)) {
      return;
    }

    if (playerState === 'playing' && wavesurferRef.current.getDuration() > 0) {
      wavesurferRef.current.play();
    } else if (playerState === 'paused') {
      wavesurferRef.current.pause();
    }
  }, [playerState, currentTrack]);

  const handlePlayPause = () => {
    if (!wavesurferRef.current) {
      return;
    }

    try {
      wavesurferRef.current.playPause();
    } catch {
      dispatchPlayerAction({ type: 'ERROR' });
    }
  };

  const handleVolumeChange = (value: number[]) => {
    dispatchPlayerAction({ type: 'SET_VOLUME', payload: value[0] });
  };

  const handleToggleMute = () => {
    dispatchPlayerAction({ type: 'TOGGLE_MUTE' });
  };

  const handleSaveOffline = async () => {
    if (!currentTrack) {
      return;
    }

    setIsSaving(true);
    try {
      await downloadAndStoreAudio(currentTrack);
      toast.success('Track saved offline!');
      // Refresh storage estimate
      queryClient.invalidateQueries({ queryKey: vaultKeys.storage() });
    } catch {
      toast.error('Failed to save track to vault');
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentTrack) {
    return null;
  }

  return (
    <div
      className="fixed right-0 bottom-0 left-0 z-50 border-neutral-800 border-t bg-neutral-900/95 shadow-2xl backdrop-blur-md"
      data-player-dock
    >
      {/* Desktop Layout */}
      <div className="hidden px-4 py-3 sm:px-6 md:block">
        <div className="flex items-center gap-4">
          {/* Track Info */}
          <div className="flex w-64 min-w-0 flex-shrink-0 items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800">
              <span className="font-medium text-neutral-300 text-sm">
                {currentTrack.type === 'generated' ? '🎵' : '📁'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate font-medium text-neutral-100 text-sm leading-tight">
                {currentTrack.title}
              </h4>
              {currentTrack.metadata?.prompt && (
                <p className="mt-0.5 truncate text-neutral-400 text-xs">
                  &ldquo;{currentTrack.metadata.prompt.substring(0, 40)}
                  ...&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Play Button */}
          <Button
            className="h-10 w-10 flex-shrink-0 rounded-md border border-neutral-700 bg-neutral-800 text-neutral-100 transition-all duration-200 hover:border-neutral-600 hover:bg-neutral-700"
            onClick={handlePlayPause}
            size="lg"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="ml-0.5 h-4 w-4" />
            )}
          </Button>

          {/* Waveform - Takes remaining space with buffering overlay */}
          <div className="min-w-0 flex-1 px-4">
            <div className="relative">
              <div
                className="h-[56px] w-full overflow-hidden rounded-lg border border-neutral-700/80 bg-neutral-800/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                ref={desktopWaveformRef}
              />
              {(isLoading || isBuffering) && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-neutral-900/30">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
                </div>
              )}
            </div>
          </div>

          {/* Desktop Controls */}
          <div className="flex flex-shrink-0 items-center gap-4">
            {/* Time Display */}
            <div className="min-w-[80px] font-mono text-neutral-400 text-xs tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <Button
                className="h-8 w-8 p-0 text-neutral-300 hover:bg-neutral-800"
                onClick={handleToggleMute}
                size="sm"
                variant="ghost"
              >
                {muted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>

              <div className="w-20">
                <Slider
                  className="cursor-pointer [&_.bg-background]:bg-neutral-100 [&_.bg-muted]:bg-neutral-700 [&_.bg-primary]:bg-neutral-300 [&_.border-primary]:border-neutral-300"
                  max={1}
                  onValueChange={handleVolumeChange}
                  step={0.01}
                  value={[muted ? 0 : volume]}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <Button
                className="h-8 w-8 p-0 text-neutral-300 hover:bg-neutral-800"
                disabled={isSaving}
                onClick={handleSaveOffline}
                size="sm"
                variant="ghost"
              >
                <Download className="h-4 w-4" />
              </Button>

              <Button
                asChild
                className="h-8 w-8 p-0 text-neutral-300 hover:bg-neutral-800"
                size="sm"
                variant="ghost"
              >
                <a download href={currentTrack.url}>
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
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800">
                <span className="font-medium text-neutral-300 text-sm">
                  {currentTrack.type === 'generated' ? '🎵' : '📁'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-medium text-neutral-100 text-sm">
                  {currentTrack.title}
                </h4>
                <p className="font-mono text-neutral-400 text-xs tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </p>
              </div>
            </div>

            {/* Play Button */}
            <Button
              className="h-12 w-12 flex-shrink-0 rounded-full border border-neutral-700 bg-neutral-800 text-neutral-100 transition-all duration-200 hover:border-neutral-600 hover:bg-neutral-700"
              onClick={handlePlayPause}
              size="lg"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="ml-0.5 h-5 w-5" />
              )}
            </Button>

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <Button
                className="h-8 w-8 p-0 text-neutral-300 hover:bg-neutral-800"
                onClick={handleToggleMute}
                size="sm"
                variant="ghost"
              >
                {muted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>

              <Button
                className="h-8 w-8 p-0 text-neutral-300 hover:bg-neutral-800"
                disabled={isSaving}
                onClick={handleSaveOffline}
                size="sm"
                variant="ghost"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Waveform */}
        <div className="px-4 pb-3">
          <div className="relative">
            <div
              className="h-12 w-full overflow-hidden rounded-lg border border-neutral-700/80 bg-neutral-800/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              ref={mobileWaveformRef}
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
  );
}
