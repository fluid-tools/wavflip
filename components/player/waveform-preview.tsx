'use client'

import { useEffect, useRef } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { cn } from '@/lib/utils'

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

  useEffect(() => {
    if (!waveformRef.current) return

    // Clean up previous instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy()
      wavesurferRef.current = null
    }

    const loadWaveform = async () => {
      try {
        let peaks: number[][] | undefined
        let duration: number | undefined

        // Try to get pre-decoded waveform data if trackKey is provided
        if (trackKey) {
          try {
            const waveformResponse = await fetch(`/api/waveform/${trackKey}`)
            if (waveformResponse.ok) {
              const waveformData = await waveformResponse.json()
              peaks = waveformData.data.peaks as number[][]
              duration = waveformData.data.duration as number
            }
          } catch (error) {
            console.warn('Failed to load pre-decoded waveform:', error)
          }
        }

        const wavesurfer = WaveSurfer.create({
          container: waveformRef.current!,
          height,
          waveColor: peaks ? 'rgb(148 163 184)' : 'rgb(203 213 225)', // Lighter color for placeholder
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
          backend: 'MediaElement', // Use MediaElement for streaming
          peaks,
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

    loadWaveform()

    return () => {
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