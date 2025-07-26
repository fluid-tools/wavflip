'use client'

import { ReactNode } from 'react'
import { useAtom } from 'jotai'
import { currentTrackAtom } from '@/state/audio-atoms'

interface StudioLayoutProps {
  children: ReactNode
}

export default function StudioLayout({ children }: StudioLayoutProps) {
  const [currentTrack] = useAtom(currentTrackAtom)
  
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <div 
        className="flex-1 min-h-0 transition-all duration-300 ease-out" 
        style={{ 
          paddingBottom: currentTrack ? '80px' : '0px' 
        }}
      >
        {children}
      </div>
    </div>
  )
} 