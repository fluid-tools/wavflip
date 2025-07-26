'use client'

import { useEffect, useRef } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { cn } from '@/lib/utils'

interface WaveformPreviewProps {
  url: string
  height?: number
  className?: string
  interact?: boolean
  onReady?: (wavesurfer: WaveSurfer) => void
  onTimeUpdate?: (time: number) => void
}

export function WaveformPreview({ 
  url, 
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

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      height,
      waveColor: 'rgb(148 163 184)',
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
      url
    })

    wavesurferRef.current = wavesurfer

    if (onReady) {
      wavesurfer.on('ready', () => onReady(wavesurfer))
    }

    if (onTimeUpdate) {
      wavesurfer.on('timeupdate', onTimeUpdate)
    }

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy()
        wavesurferRef.current = null
      }
    }
  }, [url, height, interact, onReady, onTimeUpdate])

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