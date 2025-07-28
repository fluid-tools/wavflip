'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { History, Play, Music, Volume2 } from 'lucide-react'
import { WaveformPreview } from '@/components/player/waveform-preview'
import type { GeneratedSound } from '@/types/audio'

interface RecentSheetProps {
  generatedSounds: GeneratedSound[]
  onPlaySound: (sound: GeneratedSound) => void
}

export function RecentSheet({ generatedSounds, onPlaySound }: RecentSheetProps) {
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
        <SheetHeader className="pb-4 border-b border-border/20">
          <SheetTitle className="text-base font-semibold">Recent Generations</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-full pt-3">
          <div className="space-y-2.5 pr-3">
            {generatedSounds.slice(0, 20).map((sound) => (
              <div 
                key={sound.id}
                className="group p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-all duration-200 cursor-pointer border border-border/30 hover:border-border/50 shadow-sm hover:shadow-md"
                onClick={() => onPlaySound(sound)}
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gradient-to-br from-primary/20 to-violet-500/20 flex-shrink-0">
                    {sound.metadata?.model?.includes('tts') ? (
                      <Volume2 className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Music className="h-3.5 w-3.5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground truncate">
                      {sound.title}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {sound.metadata?.prompt}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation()
                      onPlaySound(sound)
                    }}
                  >
                    <Play className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <WaveformPreview url={sound.url} height={25} />
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
} 