"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { GripVertical, Volume2, VolumeX, Headphones, Copy, Trash2, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface Track {
  id: string
  name: string
  volume: number
  pan: number
  muted: boolean
  solo: boolean
  color: string
}

interface TrackComponentProps {
  track: Track
  onUpdate: (updates: Partial<Track>) => void
  onDelete: () => void
  onDuplicate: () => void
}

export function TrackComponent({ track, onUpdate, onDelete, onDuplicate }: TrackComponentProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState(track.name)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleNameSubmit = () => {
    onUpdate({ name: tempName })
    setIsEditingName(false)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit()
    } else if (e.key === 'Escape') {
      setTempName(track.name)
      setIsEditingName(false)
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          ref={setNodeRef}
          style={style}
          className={cn(
            "h-20 bg-zinc-800 border-b border-zinc-700 flex items-center gap-3 px-3 transition-all",
            isDragging && "opacity-50 z-50",
            "hover:bg-zinc-750"
          )}
        >
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-zinc-600 rounded"
          >
            <GripVertical className="h-4 w-4 text-zinc-400" />
          </div>

          {/* Track Color */}
          <div 
            className="w-1 h-12 rounded-full flex-shrink-0"
            style={{ backgroundColor: track.color }}
          />

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            {/* Track Name */}
            <div className="mb-2">
              {isEditingName ? (
                <Input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleNameSubmit}
                  onKeyDown={handleNameKeyDown}
                  className="h-6 text-sm bg-zinc-700 border-zinc-600 text-white"
                  autoFocus
                />
              ) : (
                <div
                  className="text-sm font-medium text-white cursor-pointer hover:text-zinc-300 truncate"
                  onClick={() => setIsEditingName(true)}
                >
                  {track.name}
                </div>
              )}
            </div>

            {/* Controls Row */}
            <div className="flex items-center gap-2">
              {/* Mute/Solo */}
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={track.muted ? "default" : "ghost"}
                  className={cn(
                    "h-6 w-8 p-0 text-xs font-bold",
                    track.muted ? "bg-red-600 hover:bg-red-700" : "hover:bg-zinc-600"
                  )}
                  onClick={() => onUpdate({ muted: !track.muted })}
                >
                  M
                </Button>
                <Button
                  size="sm"
                  variant={track.solo ? "default" : "ghost"}
                  className={cn(
                    "h-6 w-8 p-0 text-xs font-bold",
                    track.solo ? "bg-yellow-600 hover:bg-yellow-700" : "hover:bg-zinc-600"
                  )}
                  onClick={() => onUpdate({ solo: !track.solo })}
                >
                  S
                </Button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-2 flex-1">
                <Volume2 className="h-3 w-3 text-zinc-400 flex-shrink-0" />
                <Slider
                  value={[track.volume]}
                  onValueChange={([value]) => onUpdate({ volume: value })}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-zinc-400 w-8 text-right">
                  {track.volume}
                </span>
              </div>
            </div>

            {/* Pan Control */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-zinc-400 w-6">Pan</span>
              <Slider
                value={[track.pan + 50]} // Convert -50 to 50 range to 0-100
                onValueChange={([value]) => onUpdate({ pan: value - 50 })}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-zinc-400 w-8 text-right">
                {track.pan > 0 ? `R${track.pan}` : track.pan < 0 ? `L${Math.abs(track.pan)}` : 'C'}
              </span>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onDuplicate}>
          <Copy className="h-4 w-4 mr-2" />
          Duplicate Track
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onUpdate({ muted: !track.muted })}>
          {track.muted ? <Volume2 className="h-4 w-4 mr-2" /> : <VolumeX className="h-4 w-4 mr-2" />}
          {track.muted ? 'Unmute' : 'Mute'}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onUpdate({ solo: !track.solo })}>
          <Headphones className="h-4 w-4 mr-2" />
          {track.solo ? 'Unsolo' : 'Solo'}
        </ContextMenuItem>
        <ContextMenuItem>
          <Settings className="h-4 w-4 mr-2" />
          Track Settings
        </ContextMenuItem>
        <ContextMenuItem onClick={onDelete} className="text-red-400 focus:text-red-400">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Track
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}