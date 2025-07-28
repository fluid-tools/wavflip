'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Loader2, Play, Pause, Download, MoreHorizontal, Copy, Trash2, Music, Volume2 } from 'lucide-react'
import { WaveformPreview } from '@/components/player/waveform-preview'
import { cn } from '@/lib/utils'
import { useAtom } from 'jotai'
import { currentTrackAtom, playerStateAtom } from '@/state/audio-atoms'
import type { GeneratedSound } from '@/types/audio'
import { toast } from 'sonner'

interface ChatMessageProps {
  type: 'user' | 'assistant' | 'system'
  content?: string
  sound?: GeneratedSound
  isGenerating?: boolean
  generationProgress?: number
  onPlaySound?: (sound: GeneratedSound) => void
  onDeleteSound?: (soundId: string) => void
  onCopyUrl?: (url: string) => void
}

export function ChatMessage({
  type,
  content,
  sound,
  isGenerating = false,
  generationProgress = 0,
  onPlaySound,
  onDeleteSound,
  onCopyUrl
}: ChatMessageProps) {
  const isUser = type === 'user'
  const isSystem = type === 'system'
  
  const [currentTrack] = useAtom(currentTrackAtom)
  const [playerState] = useAtom(playerStateAtom)
  
  const isCurrentTrack = currentTrack?.id === sound?.id
  const isPlaying = playerState === 'playing' && isCurrentTrack

  return (
    <div className={cn(
      "flex",
      isUser && "justify-end"
    )}>
      <div className={cn(
        "max-w-[85%]",
        isUser && "ml-auto"
      )}>
        <div className={cn(
          sound || isGenerating ? "rounded-2xl px-4 py-3" : "rounded-2xl px-4 py-3",
          isUser && "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
          type === 'assistant' && "bg-muted/40 border border-border/50",
          isSystem && "bg-muted/40 border border-border/50"
        )}>
          {content && (
            <div className="space-y-2">
              {isGenerating && (
                <div className="flex items-center gap-2 text-xs">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Generating... {Math.round(generationProgress * 100)}%
                </div>
              )}
              <p className="text-sm leading-relaxed">
                {content}
              </p>
              {isGenerating && (
                <Progress value={generationProgress * 100} className="h-1" />
              )}
            </div>
          )}

          {sound && (
            <ContextMenu>
              <ContextMenuTrigger>
                <div className="bg-neutral-900/90 backdrop-blur-sm rounded-xl border border-neutral-800 hover:bg-neutral-800/90 transition-all cursor-pointer mt-2">
                  <div className="flex items-start gap-3 p-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-neutral-800 border border-neutral-700 flex-shrink-0">
                      {sound.metadata?.model?.includes('tts') ? (
                        <Volume2 className="h-3.5 w-3.5 text-neutral-300" />
                      ) : (
                        <Music className="h-3.5 w-3.5 text-neutral-300" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-sm text-neutral-100 truncate">
                          {sound.title}
                        </h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0 hover:bg-neutral-800 text-neutral-300 flex-shrink-0"
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => onCopyUrl?.(sound.url)}>
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
                            <DropdownMenuItem 
                              onClick={() => onDeleteSound?.(sound.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* Waveform Preview */}
                      <div className="mb-2">
                        <WaveformPreview url={sound.url} height={30} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-xs h-3.5 px-1.5 border-neutral-700 text-neutral-300">
                            {sound.metadata?.model?.replace('elevenlabs-', '')}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-0.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              onPlaySound?.(sound)
                            }}
                            className={cn(
                              "h-6 w-6 p-0 transition-all",
                              isCurrentTrack 
                                ? "bg-neutral-700 hover:bg-neutral-600 text-neutral-100" 
                                : "hover:bg-neutral-800 text-neutral-300"
                            )}
                          >
                            {isPlaying ? (
                              <Pause className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            className="h-6 w-6 p-0 hover:bg-neutral-800 text-neutral-300"
                          >
                            <a href={sound.url} download>
                              <Download className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-40 bg-neutral-900 border border-neutral-800">
                <ContextMenuItem 
                  onClick={() => onPlaySound?.(sound)}
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
                  onClick={() => onCopyUrl?.(sound.url)}
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
                <ContextMenuItem 
                  onClick={() => onDeleteSound?.(sound.id)}
                  className="text-red-400 hover:bg-neutral-800 focus:bg-neutral-800 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )}
        </div>
      </div>
    </div>
  )
} 