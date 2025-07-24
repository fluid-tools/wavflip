"use client"

import { useState } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TrackComponent } from "./components/track"
import { TimelineGrid } from "./components/timeline-grid"
import { TransportControls } from "./components/transport-controls"

interface Track {
  id: string
  name: string
  volume: number
  pan: number
  muted: boolean
  solo: boolean
  color: string
}

export default function DAWPage() {
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: "1",
      name: "Kick Drum",
      volume: 75,
      pan: 0,
      muted: false,
      solo: false,
      color: "#ef4444"
    },
    {
      id: "2", 
      name: "Snare",
      volume: 68,
      pan: 5,
      muted: false,
      solo: false,
      color: "#f97316"
    },
    {
      id: "3",
      name: "Hi-Hat",
      volume: 45,
      pan: -10,
      muted: false,
      solo: false,
      color: "#eab308"
    },
    {
      id: "4",
      name: "Bass",
      volume: 82,
      pan: 0,
      muted: false,
      solo: false,
      color: "#22c55e"
    }
  ])

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setTracks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const addTrack = () => {
    const newTrack: Track = {
      id: Date.now().toString(),
      name: `Track ${tracks.length + 1}`,
      volume: 75,
      pan: 0,
      muted: false,
      solo: false,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    }
    setTracks([...tracks, newTrack])
  }

  const updateTrack = (id: string, updates: Partial<Track>) => {
    setTracks(tracks.map(track => 
      track.id === id ? { ...track, ...updates } : track
    ))
  }

  const deleteTrack = (id: string) => {
    setTracks(tracks.filter(track => track.id !== id))
  }

  const duplicateTrack = (id: string) => {
    const track = tracks.find(t => t.id === id)
    if (track) {
      const newTrack = {
        ...track,
        id: Date.now().toString(),
        name: `${track.name} Copy`
      }
      const index = tracks.findIndex(t => t.id === id)
      const newTracks = [...tracks]
      newTracks.splice(index + 1, 0, newTrack)
      setTracks(newTracks)
    }
  }

  return (
    <div className="h-screen w-screen bg-zinc-900 text-white overflow-hidden flex flex-col">
      {/* Transport Controls */}
      <TransportControls 
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        currentTime={currentTime}
      />

      {/* Main DAW Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track List */}
        <div className="w-80 bg-zinc-800 border-r border-zinc-700 flex flex-col">
          {/* Track Header */}
          <div className="h-12 bg-zinc-750 border-b border-zinc-700 flex items-center justify-between px-4">
            <h2 className="text-sm font-medium text-zinc-300">Tracks</h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={addTrack}
              className="h-8 w-8 p-0 hover:bg-zinc-600"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Tracks */}
          <div className="flex-1 overflow-y-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext items={tracks} strategy={verticalListSortingStrategy}>
                {tracks.map((track) => (
                  <TrackComponent
                    key={track.id}
                    track={track}
                    onUpdate={(updates) => updateTrack(track.id, updates)}
                    onDelete={() => deleteTrack(track.id)}
                    onDuplicate={() => duplicateTrack(track.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Timeline Area */}
        <div className="flex-1 flex flex-col bg-zinc-900">
          <TimelineGrid 
            tracks={tracks}
            currentTime={currentTime}
            onTimeChange={setCurrentTime}
          />
        </div>
      </div>
    </div>
  )
}