'use client'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { History, Play, Pause, Music, Volume2, MoreHorizontal, Copy, Download } from 'lucide-react'
import { WaveformPreview } from '@/components/player/waveform-preview'
import { useAtom } from 'jotai'
import { currentTrackAtom, playerStateAtom } from '@/state/audio-atoms'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Virtuoso } from 'react-virtuoso'
import type { GeneratedSound } from '@/types/audio'

interface RecentSheetProps {
  generatedSounds: GeneratedSound[]
  onPlaySound: (sound: GeneratedSound) => void
}

export function RecentSheet({ generatedSounds, onPlaySound }: RecentSheetProps) {
  const [currentTrack] = useAtom(currentTrackAtom)
  const [playerState] = useAtom(playerStateAtom)
  
  if (generatedSounds.length === 0) return null

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copied to clipboard')
  }

  // Show all recent sounds (newest first)
  const recentSounds = [...generatedSounds].reverse()

  const renderSoundCard = (sound: GeneratedSound) => {
    const isCurrentTrack = currentTrack?.id === sound.id
    const isPlaying = playerState === 'playing' && isCurrentTrack
    
    return (
      <div className="px-4 py-2">
        <ContextMenu>
          <ContextMenuTrigger>
            <div 
              className="group bg-neutral-900/50 backdrop-blur-sm rounded-xl border border-neutral-800 hover:bg-neutral-800/80 transition-all duration-200 cursor-pointer hover:border-neutral-700 shadow-sm hover:shadow-md"
              onClick={() => onPlaySound(sound)}
            >
              <div className="p-3">
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-neutral-800 border border-neutral-700 flex-shrink-0">
                    {sound.metadata?.model?.includes('tts') ? (
                      <Volume2 className="h-3.5 w-3.5 text-neutral-300" />
                    ) : (
                      <Music className="h-3.5 w-3.5 text-neutral-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm text-neutral-100 truncate">
                        {sound.title}
                      </h4>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-neutral-800 text-neutral-300 flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => handleCopyUrl(sound.url)}>
                            <Copy className="h-3.5 w-3.5 mr-2" />
                            Copy URL
                          </DropdownMenuItem>
                          {sound.metadata?.prompt && (
                            <DropdownMenuItem onClick={() => {
                              navigator.clipboard.writeText(sound.metadata!.prompt!)
                              toast.success('Prompt copied to clipboard')
                            }}>
                              <Copy className="h-3.5 w-3.5 mr-2" />
                              Copy Prompt
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <a href={sound.url} download>
                              <Download className="h-3.5 w-3.5 mr-2" />
                              Download
                            </a>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-1 leading-relaxed">
                      {sound.metadata?.prompt}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      "h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200",
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
                
                {/* Waveform Preview */}
                <div className="mb-2">
                  <WaveformPreview url={sound.url} height={24} />
                </div>
                
                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <div className="px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs">
                    {sound.metadata?.model?.replace('elevenlabs-', '')}
                  </div>
                </div>
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-40 bg-neutral-900 border border-neutral-800">
            <ContextMenuItem 
              onClick={() => onPlaySound(sound)}
              className="text-neutral-100 hover:bg-neutral-800 focus:bg-neutral-800"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isPlaying ? 'Pause' : 'Play'}
            </ContextMenuItem>
            <ContextMenuItem 
              onClick={() => handleCopyUrl(sound.url)}
              className="text-neutral-100 hover:bg-neutral-800 focus:bg-neutral-800"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy URL
            </ContextMenuItem>
            {sound.metadata?.prompt && (
              <ContextMenuItem 
                onClick={() => {
                  navigator.clipboard.writeText(sound.metadata!.prompt!)
                  toast.success('Prompt copied to clipboard')
                }}
                className="text-neutral-100 hover:bg-neutral-800 focus:bg-neutral-800"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Prompt
              </ContextMenuItem>
            )}
            <ContextMenuItem asChild>
              <a href={sound.url} download className="text-neutral-100 hover:bg-neutral-800 focus:bg-neutral-800">
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
    )
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
          <History className="h-3.5 w-3.5" />
          Recent ({generatedSounds.length})
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[420px] p-0">
        <SheetHeader className="px-6 py-4 border-b border-neutral-800">
          <SheetTitle className="text-lg font-semibold text-neutral-100">Recent Generations</SheetTitle>
          <p className="text-sm text-neutral-400 mt-1">Your latest sound creations</p>
        </SheetHeader>
        <div className="flex-1 min-h-0">
          <Virtuoso
            style={{ height: '100%' }}
            totalCount={recentSounds.length}
            itemContent={(index) => renderSoundCard(recentSounds[index])}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
} 