"use client"

import { useRef, useEffect, useState } from "react"

interface Track {
  id: string
  name: string
  volume: number
  pan: number
  muted: boolean
  solo: boolean
  color: string
}

interface TimelineGridProps {
  tracks: Track[]
  currentTime: number
  onTimeChange: (time: number) => void
}

export function TimelineGrid({ tracks, currentTime, onTimeChange }: TimelineGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [scrollX, setScrollX] = useState(0)

  const trackHeight = 80
  const timelineHeight = 40
  const pixelsPerSecond = 50 * zoom
  const totalDuration = 300 // 5 minutes in seconds
  const gridWidth = totalDuration * pixelsPerSecond

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Draw timeline background
    ctx.fillStyle = '#18181b' // zinc-900
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Draw timeline ruler
    ctx.fillStyle = '#27272a' // zinc-800
    ctx.fillRect(0, 0, rect.width, timelineHeight)

    // Draw time markers
    ctx.fillStyle = '#71717a' // zinc-500
    ctx.font = '11px monospace'
    ctx.textAlign = 'center'

    const startTime = Math.floor(scrollX / pixelsPerSecond)
    const endTime = Math.ceil((scrollX + rect.width) / pixelsPerSecond)

    for (let time = startTime; time <= endTime; time += 5) {
      const x = time * pixelsPerSecond - scrollX
      if (x >= 0 && x <= rect.width) {
        // Major time markers (every 5 seconds)
        ctx.strokeStyle = '#52525b' // zinc-600
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, timelineHeight)
        ctx.stroke()

        // Time labels
        const minutes = Math.floor(time / 60)
        const seconds = time % 60
        ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, x, timelineHeight - 8)
      }

      // Minor time markers (every second)
      for (let subTime = time + 1; subTime < time + 5 && subTime <= endTime; subTime++) {
        const subX = subTime * pixelsPerSecond - scrollX
        if (subX >= 0 && subX <= rect.width) {
          ctx.strokeStyle = '#3f3f46' // zinc-700
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(subX, timelineHeight - 10)
          ctx.lineTo(subX, timelineHeight)
          ctx.stroke()
        }
      }
    }

    // Draw track lanes
    tracks.forEach((track, index) => {
      const y = timelineHeight + index * trackHeight
      
      // Track background (alternating colors)
      ctx.fillStyle = index % 2 === 0 ? '#1f1f23' : '#18181b'
      ctx.fillRect(0, y, rect.width, trackHeight)

      // Track border
      ctx.strokeStyle = '#27272a'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, y + trackHeight)
      ctx.lineTo(rect.width, y + trackHeight)
      ctx.stroke()

      // Sample waveform placeholder (for demonstration)
      if (index < 2) { // Only show waveform for first two tracks
        ctx.fillStyle = track.color + '40' // Add transparency
        const waveformWidth = 120 * pixelsPerSecond // 2 minutes of audio
        const waveformX = 10 * pixelsPerSecond - scrollX // Start at 10 seconds
        
        if (waveformX < rect.width && waveformX + waveformWidth > 0) {
          ctx.fillRect(
            Math.max(0, waveformX), 
            y + 10, 
            Math.min(waveformWidth, rect.width - Math.max(0, waveformX)), 
            trackHeight - 20
          )

          // Waveform outline
          ctx.strokeStyle = track.color
          ctx.lineWidth = 1
          ctx.strokeRect(
            Math.max(0, waveformX), 
            y + 10, 
            Math.min(waveformWidth, rect.width - Math.max(0, waveformX)), 
            trackHeight - 20
          )
        }
      }
    })

    // Draw playhead
    const playheadX = currentTime * pixelsPerSecond - scrollX
    if (playheadX >= 0 && playheadX <= rect.width) {
      ctx.strokeStyle = '#ef4444' // red-500
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(playheadX, 0)
      ctx.lineTo(playheadX, rect.height)
      ctx.stroke()

      // Playhead triangle
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.moveTo(playheadX - 6, 0)
      ctx.lineTo(playheadX + 6, 0)
      ctx.lineTo(playheadX, 12)
      ctx.closePath()
      ctx.fill()
    }

  }, [tracks, currentTime, zoom, scrollX, trackHeight, timelineHeight, pixelsPerSecond, totalDuration, gridWidth])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const time = (x + scrollX) / pixelsPerSecond
    onTimeChange(Math.max(0, Math.min(totalDuration, time)))
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const newZoom = Math.max(0.1, Math.min(5, zoom + (e.deltaY > 0 ? -0.1 : 0.1)))
      setZoom(newZoom)
    } else {
      // Horizontal scroll
      const newScrollX = Math.max(0, Math.min(gridWidth - (containerRef.current?.clientWidth || 0), scrollX + e.deltaX))
      setScrollX(newScrollX)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Timeline Header */}
      <div className="h-10 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">Timeline</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Zoom:</span>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-20 h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-zinc-500 w-8">{zoom.toFixed(1)}x</span>
          </div>
        </div>
      </div>

      {/* Timeline Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-crosshair"
        onWheel={handleWheel}
      >
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="absolute inset-0"
        />
      </div>
    </div>
  )
}