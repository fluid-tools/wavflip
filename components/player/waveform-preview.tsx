'use client'

import { useEffect, useRef } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { cn } from '@/lib/utils'
import { generateWaveformData } from '@/lib/audio/waveform-generator'
import { useWaveform } from '@/hooks/data/use-waveform'

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
  const waveform = useWaveform(trackKey)

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

        // Offline blob: try local pre-decode for reliable bars; no API calls
        // Streaming: use placeholder peaks (cache first)
        if (isBlob) {
          try {
            const resp = await fetch(url)
            if (resp.ok) {
              const buf = await resp.arrayBuffer()
              const wf = await generateWaveformData(buf)
              peaks = wf.peaks
              duration = wf.duration
            }
          } catch {}
        } else if (trackKey) {
          const wf = waveform.data
          if (wf?.peaks?.length) {
            peaks = wf.peaks
            duration = wf.duration
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
          backend: 'MediaElement',
          splitChannels: undefined,
          peaks: peaks ? [peaks] : undefined,
          duration,
          url: isBlob ? url : undefined
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
  }, [url, trackKey, height, interact, onReady, onTimeUpdate, waveform.data])

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