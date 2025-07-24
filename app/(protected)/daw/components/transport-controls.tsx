"use client"

import { Button } from "@/components/ui/button"
import { Play, Pause, Square, SkipBack, SkipForward, RotateCcw } from "lucide-react"

interface TransportControlsProps {
  isPlaying: boolean
  onPlayPause: () => void
  currentTime: number
}

export function TransportControls({ isPlaying, onPlayPause, currentTime }: TransportControlsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="h-16 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between px-6">
      {/* Left Section - Transport Controls */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="h-10 w-10 p-0 hover:bg-zinc-700"
          onClick={() => {}}
        >
          <SkipBack className="h-5 w-5" />
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          className="h-10 w-10 p-0 hover:bg-zinc-700"
          onClick={() => {}}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant={isPlaying ? "secondary" : "default"}
          className="h-12 w-12 p-0"
          onClick={onPlayPause}
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="h-10 w-10 p-0 hover:bg-zinc-700"
          onClick={() => {}}
        >
          <Square className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="h-10 w-10 p-0 hover:bg-zinc-700"
          onClick={() => {}}
        >
          <SkipForward className="h-5 w-5" />
        </Button>
      </div>

      {/* Center Section - Time Display */}
      <div className="flex items-center gap-4">
        <div className="text-sm font-mono text-zinc-300 bg-zinc-900 px-3 py-1 rounded border border-zinc-600">
          {formatTime(currentTime)}
        </div>
        <div className="text-xs text-zinc-500">
          120 BPM • 4/4
        </div>
      </div>

      {/* Right Section - Additional Controls */}
      <div className="flex items-center gap-2">
        <div className="text-xs text-zinc-500">
          44.1 kHz • 24-bit
        </div>
      </div>
    </div>
  )
}