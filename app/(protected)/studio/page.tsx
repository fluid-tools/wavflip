'use client'
import { SoundGenerator } from '@/components/gen-ai/sound-gen'
import { currentTrackAtom } from '@/state/audio-atoms'
import { useAtom } from 'jotai'

export default function StudioPage() {
  const [currentTrack] = useAtom(currentTrackAtom)

  return (
    <div
      className="flex-1 min-h-0 transition-all duration-300 ease-out"
      style={{
        paddingBottom: currentTrack ? '80px' : '0px'
      }}
    >
      <SoundGenerator />
    </div>
  )
} 