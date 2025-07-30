'use client'

import { AppSidebar } from './app-sidebar'
import { useAtom } from 'jotai'
import { currentTrackAtom } from '@/state/audio-atoms'

export function SidebarWrapper() {
  const [currentTrack] = useAtom(currentTrackAtom)
  
  return (
    <div 
      className="transition-all duration-300 ease-out"
      style={{
        height: currentTrack ? 'calc(100vh - 88px)' : '100vh'
      }}
    >
      <AppSidebar />
    </div>
  )
}