'use client'

import { useEffect, useRef } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { cn } from '@/lib/utils'
import { generateWaveformData } from '@/lib/audio/waveform-generator'

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
        let monoPeaks: number[] | undefined
        let duration: number | undefined

        const isBlob = url.startsWith('blob:')
        const isSameOriginAudio = url.startsWith('/api/audio/') || url.startsWith(location.origin)

        // Prefer local decode for blob/offline
        if (isBlob) {
          try {
            const resp = await fetch(url)
            const buf = await resp.arrayBuffer()
            const wf = await generateWaveformData(buf)
            monoPeaks = wf.peaks
            duration = wf.duration
          } catch (error) {
            console.warn('Failed to decode blob for waveform preview:', error)
          }
        } else if (isSameOriginAudio) {
          // Try full local decode for accurate peaks
          try {
            const resp = await fetch(url)
            if (resp.ok && resp.body) {
              const buf = await resp.arrayBuffer()
              const wf = await generateWaveformData(buf)
              monoPeaks = wf.peaks
              duration = wf.duration
            }
          } catch (error) {
            console.warn('Failed to decode streaming audio for preview, will fallback:', error)
          }
        }

        if (!monoPeaks && trackKey) {
          // Fallback to placeholder when streaming
          try {
            const waveformResponse = await fetch(`/api/waveform/${encodeURIComponent(trackKey)}`)
            if (waveformResponse.ok) {
              const waveformData = await waveformResponse.json()
              monoPeaks = waveformData.data.peaks as number[]
              duration = waveformData.data.duration as number
            }
          } catch (error) {
            console.warn('Failed to load pre-decoded waveform:', error)
          }
        }

        const wavesurfer = WaveSurfer.create({
          container: waveformRef.current!,
          height,
          waveColor: monoPeaks ? 'rgb(148 163 184)' : 'rgb(203 213 225)',
          progressColor: 'rgb(59 130 246)',
          cursorColor: interact ? 'rgb(59 130 246)' : 'transparent',
          cursorWidth: interact ? 2 : 0,
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          barAlign: 'top',
          fillParent: true,
          interact,
          dragToSeek: interact,
          normalize: true,
          // Prefer WebAudio when we have local peaks
          backend: monoPeaks || url.startsWith('blob:') ? 'WebAudio' : 'MediaElement',
          // Single-lane look: pass mono only
          peaks: monoPeaks ? [monoPeaks] : undefined,
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