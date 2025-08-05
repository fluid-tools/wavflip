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
        "max-w-md w-full",
        isUser && "ml-auto"
      )}>
        {content && (
          <div className={cn(
            "rounded-lg px-3 py-2 mb-2",
            isUser 
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto" 
              : "bg-black/5 dark:bg-white/5 border border-border/30"
          )}>
            {isGenerating && (
              <div className="flex items-center gap-2 text-xs mb-1 opacity-80">
                <Loader2 className="h-3 w-3 animate-spin" />
                Generating... {Math.round(generationProgress * 100)}%
              </div>
            )}
            <p className="text-sm leading-relaxed">{content}</p>
            {isGenerating && (
              <div className="mt-2">
                <Progress 
                  value={generationProgress * 100} 
                  className={cn(
                    "h-1",
                    isUser ? "bg-white/20" : "bg-muted"
                  )}
                />
              </div>
            )}
          </div>
        )}

        {sound && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 max-w-md w-full p-3 flex flex-col gap-2">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              {sound.metadata?.model?.includes('tts') ? (
                <Volume2 className="h-4 w-4 text-blue-400" />
              ) : (
                <Music className="h-4 w-4 text-blue-400" />
              )}
              <h4 className="font-semibold text-base text-white truncate flex-1">{sound.title}</h4>
              <Badge className="bg-neutral-800 text-neutral-300 border-0 text-xs px-2 py-0.5">
                {sound.metadata?.model?.includes('tts') ? 'text-to-speech' : 'sound-effects'}
              </Badge>
            </div>
            {/* Waveform */}
            <div className="rounded-md border border-neutral-800 bg-neutral-800 px-2 py-1">
              <WaveformPreview url={sound.url} height={32} />
            </div>
            {/* Controls */}
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onPlaySound?.(sound)
                  }}
                  className={cn(
                    "h-8 w-8 rounded-full p-0",
                    isCurrentTrack && isPlaying
                      ? "bg-blue-600 hover:bg-blue-500 text-white" 
                      : "bg-white hover:bg-neutral-100 text-neutral-900"
                  )}
                >
                  {isPlaying && isCurrentTrack ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 ml-0.5" />
                  )}
                </Button>
                <span className="text-xs text-neutral-400">{sound.duration ? `${Math.round(sound.duration)}s` : ''}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  asChild
                  className="h-8 w-8 p-0 text-neutral-400 hover:text-white"
                >
                  <a href={sound.url} download>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-neutral-400 hover:text-white"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => onCopyUrl?.(sound.url)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy URL
                    </DropdownMenuItem>
                    {sound.metadata?.prompt && (
                      <DropdownMenuItem onClick={() => {
                        navigator.clipboard.writeText(sound.metadata!.prompt!)
                        toast.success('Prompt copied to clipboard')
                      }}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Prompt
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => onDeleteSound?.(sound.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 