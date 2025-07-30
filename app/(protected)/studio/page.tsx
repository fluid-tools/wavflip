'use client'
import { SoundGenerator } from '@/components/gen-ai/sound-gen'
import { currentTrackAtom } from '@/state/audio-atoms'
import { useAtom } from 'jotai'

export default function StudioPage() {
  const [currentTrack] = useAtom(currentTrackAtom)
  
  return (
    <div 
      className="h-full w-full transition-all duration-300 ease-out"
      style={{
        paddingBottom: currentTrack ? '88px' : '0px'
      }}
    >
      <SoundGenerator />
    </div>
  )
} 