'use client'

import { useEffect, useRef } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { cn } from '@/lib/utils'
// We intentionally do not predecode blobs here; WebAudio backend will decode and render.
import { useAtom } from 'jotai'
import { waveformCacheAtom } from '@/state/audio-atoms'

interface WaveformPreviewProps {
  url: string
  trackKey?: string
  height?: number
  className?: string
  interact?: boolean
  onReady?: (wavesurfer: WaveSurfer) => void
  onTimeUpdate?: (time: number) => void
}

export function WaveformPreview({ 
  url, 
  trackKey,
  height = 30, 
  className, 
  interact = false,
  onReady,
  onTimeUpdate
}: WaveformPreviewProps) {
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [wfCache, setWfCache] = useAtom(waveformCacheAtom)

  useEffect(() => {
    if (!waveformRef.current) return

    // Clean up previous instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy()
      wavesurferRef.current = null
    }

    const loadWaveform = async () => {
      try {
        let peaks: number[] | undefined
        let duration: number | undefined
        const isBlob = url.startsWith('blob:')

        // Offline blob: never hit /api/waveform; let WebAudio decode & render
        // Streaming: use placeholder peaks (cache first)
        if (!isBlob && trackKey) {
          const cached = wfCache[trackKey]
          if (cached) peaks = cached
          if (!peaks) {
            try {
              const res = await fetch(`/api/waveform/${encodeURIComponent(trackKey)}`)
              if (res.ok) {
                const data = await res.json()
                peaks = data.data.peaks as number[]
                duration = data.data.duration as number
                setWfCache({ ...wfCache, [trackKey]: peaks })
              }
            } catch {}
          }
        }

        // Abort guard after async
        if (!waveformRef.current) return

        const wavesurfer = WaveSurfer.create({
          container: waveformRef.current,
          height,
          waveColor: peaks ? 'rgb(148 163 184)' : 'rgb(203 213 225)',
          progressColor: 'rgb(59 130 246)',
          cursorColor: interact ? 'rgb(59 130 246)' : 'transparent',
          cursorWidth: interact ? 2 : 0,
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          fillParent: true,
          interact,
          dragToSeek: interact,
          normalize: true,
          backend: isBlob ? 'WebAudio' : 'MediaElement',
          splitChannels: undefined,
          peaks: peaks ? [peaks] : undefined,
          duration,
          url
        })

        wavesurferRef.current = wavesurfer

        if (onReady) {
          wavesurfer.on('ready', () => onReady(wavesurfer))
        }

        if (onTimeUpdate) {
          wavesurfer.on('timeupdate', onTimeUpdate)
        }
      } catch (error) {
        console.error('Error loading waveform:', error)
      }
    }

    let cancelled = false
    ;(async () => {
      if (cancelled) return
      await loadWaveform()
    })()

    return () => {
      cancelled = true
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy()
        wavesurferRef.current = null
      }
    }
  }, [url, trackKey, height, interact, onReady, onTimeUpdate])

  return (
    <div 
      ref={waveformRef}
      className={cn(
        "w-full rounded-lg overflow-hidden bg-muted/30 ring-1 ring-border/20",
        className
      )}
    />
  )
} 