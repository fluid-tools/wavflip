'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { History, Play, Pause, Music, Volume2 } from 'lucide-react'
import { WaveformPreview } from '@/components/player/waveform-preview'
import { useAtom } from 'jotai'
import { currentTrackAtom, playerStateAtom } from '@/state/audio-atoms'
import { cn } from '@/lib/utils'
import type { GeneratedSound } from '@/types/audio'

interface RecentSheetProps {
  generatedSounds: GeneratedSound[]
  onPlaySound: (sound: GeneratedSound) => void
}

export function RecentSheet({ generatedSounds, onPlaySound }: RecentSheetProps) {
  const [currentTrack] = useAtom(currentTrackAtom)
  const [playerState] = useAtom(playerStateAtom)
  
  if (generatedSounds.length === 0) return null

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
          <History className="h-3.5 w-3.5" />
          Recent ({generatedSounds.length})
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[380px]">
        <SheetHeader className="pb-4 border-b border-neutral-800">
          <SheetTitle className="text-base font-semibold text-neutral-100">Recent Generations</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-full pt-3">
          <div className="space-y-2.5 pr-3">
            {generatedSounds.slice(0, 20).map((sound) => {
              const isCurrentTrack = currentTrack?.id === sound.id
              const isPlaying = playerState === 'playing' && isCurrentTrack
              
              return (
                <div 
                  key={sound.id}
                  className="group p-3 rounded-lg bg-neutral-900/50 hover:bg-neutral-800/80 transition-all duration-200 cursor-pointer border border-neutral-800 hover:border-neutral-700 shadow-sm hover:shadow-md"
                  onClick={() => onPlaySound(sound)}
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-neutral-800 border border-neutral-700 flex-shrink-0">
                      {sound.metadata?.model?.includes('tts') ? (
                        <Volume2 className="h-3.5 w-3.5 text-neutral-300" />
                      ) : (
                        <Music className="h-3.5 w-3.5 text-neutral-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-neutral-100 truncate">
                        {sound.title}
                      </h4>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">
                        {sound.metadata?.prompt}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                        isCurrentTrack 
                          ? "bg-neutral-700 hover:bg-neutral-600 text-neutral-100" 
                          : "hover:bg-neutral-800 text-neutral-300"
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onPlaySound(sound)
                      }}
                    >
                      {isPlaying ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  <WaveformPreview url={sound.url} height={25} />
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
} 