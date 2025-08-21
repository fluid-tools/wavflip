'use client';

import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useWaveform } from '@/hooks/data/use-waveform';
import {
  generatePlaceholderWaveform,
  generateWaveformData,
} from '@/lib/audio/waveform-generator';
import { getTrackFromVault } from '@/lib/storage/local-vault';
import { mediaStore } from '@/lib/storage/media-store';
import { cn } from '@/lib/utils';

// todo: isplaceholder usage missing. display a badge along with the waveform if it is placeholder.

interface WaveformPreviewProps {
  url: string;
  trackKey?: string;
  height?: number;
  className?: string;
  interact?: boolean;
  onReady?: (wavesurfer: WaveSurfer) => void;
  onTimeUpdate?: (time: number) => void;
  approxDuration?: number;
}

export function WaveformPreview({
  url,
  trackKey,
  height = 30,
  className,
  interact = false,
  onReady,
  onTimeUpdate,
  approxDuration,
}: WaveformPreviewProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const waveform = useWaveform(trackKey);

  useEffect(() => {
    if (!waveformRef.current) return;

    // Clean up previous instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }

    const loadWaveform = async () => {
      try {
        let peaks: number[] | undefined;
        let duration: number | undefined;
        const isBlob = url.startsWith('blob:');

        // Offline blob: try local pre-decode for reliable bars; no API calls
        // Streaming: use placeholder peaks (cache first)
        // Prefer decoding from local vault audioData to avoid fetching blob URLs
        if (trackKey) {
          try {
            const local = await getTrackFromVault(trackKey);
            if (local?.audioData) {
              const wf = await generateWaveformData(local.audioData);
              peaks = wf.peaks;
              duration = wf.duration;
            } else {
              // OPFS-only path: read bytes from OPFS when available
              try {
                const buf = await mediaStore.readFile(trackKey);
                if (buf) {
                  const wf = await generateWaveformData(buf);
                  peaks = wf.peaks;
                  duration = wf.duration;
                }
              } catch {}
            }
          } catch {}
        }

        // If still no peaks and we are online streaming, use server waveform
        if (!(peaks || isBlob) && trackKey) {
          const wf = waveform.data;
          if (wf?.peaks?.length) {
            peaks = wf.peaks;
            duration = wf.duration;
          }
        }

        // If we still do not have peaks, render a deterministic placeholder to avoid layout flicker
        if (!peaks && approxDuration) {
          const ph = generatePlaceholderWaveform(approxDuration);
          peaks = ph.peaks;
          duration = ph.duration;
        }

        // Abort guard after async
        if (!waveformRef.current) return;

        const wavesurfer = WaveSurfer.create({
          container: waveformRef.current,
          height,
          waveColor: peaks ? 'rgba(148,163,184,0.55)' : 'rgba(203,213,225,0.6)',
          progressColor: 'rgba(255,255,255,0.9)',
          cursorColor: interact ? 'rgba(255,255,255,0.7)' : 'transparent',
          cursorWidth: interact ? 1 : 0,
          fillParent: true,
          interact,
          dragToSeek: interact,
          normalize: true,
          backend: 'MediaElement',
          splitChannels: undefined,
          peaks: peaks ? [peaks] : undefined,
          duration,
          // Avoid passing url when we already have peaks to prevent an unnecessary fetch
          url: peaks || isBlob ? undefined : url,
        });

        wavesurferRef.current = wavesurfer;

        if (onReady) {
          wavesurfer.on('ready', () => onReady(wavesurfer));
        }

        if (onTimeUpdate) {
          wavesurfer.on('timeupdate', onTimeUpdate);
        }
      } catch (error) {
        console.error('Error loading waveform:', error);
      }
    };

    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await loadWaveform();
    })();

    return () => {
      cancelled = true;
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [
    url,
    trackKey,
    height,
    interact,
    onReady,
    onTimeUpdate,
    waveform.data,
    approxDuration,
  ]);

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-lg bg-muted/30 ring-1 ring-border/20',
        className
      )}
      ref={waveformRef}
    />
  );
}
