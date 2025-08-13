'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Loader2, Play, Pause, Download, MoreHorizontal, Copy, Trash2 } from 'lucide-react'
import { WaveformPreview } from '@/components/player/waveform-preview'
import { cn } from '@/lib/utils'
import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { currentTrackAtom, playerStateAtom } from '@/state/audio-atoms'
import type { GeneratedSound } from "@/types/generations"
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'

function computeDeterministicProgress(startedAt?: Date, etaSeconds?: number, nowMs?: number): number {
  if (!startedAt || !etaSeconds || etaSeconds <= 0) return 0
  const now = typeof nowMs === 'number' ? nowMs : Date.now()
  const elapsed = (now - new Date(startedAt).getTime()) / 1000
  const pct = Math.max(0, Math.min(1, elapsed / etaSeconds))
  return Math.round(pct * 100)
}

interface ChatMessageProps {
  type: 'user' | 'assistant' | 'system'
  content?: string
  sound?: GeneratedSound
  isGenerating?: boolean
  etaSeconds?: number
  startedAt?: Date
  onPlaySound?: (sound: GeneratedSound) => void
  onDeleteSound?: (soundId: string) => void
  onCopyUrl?: (url: string) => void
}

export function ChatMessage({
  type,
  content,
  sound,
  isGenerating = false,
  etaSeconds,
  startedAt,
  onPlaySound,
  onDeleteSound,
  onCopyUrl
}: ChatMessageProps) {
  const isUser = type === 'user'
  
  const [currentTrack] = useAtom(currentTrackAtom)
  const [playerState] = useAtom(playerStateAtom)
  
  const isCurrentTrack = currentTrack?.id === sound?.id
  const isPlaying = playerState === 'playing' && isCurrentTrack

  const isMobile = useIsMobile()
  const waveformHeight = isMobile ? 32 : 48

  // Tick to update the time-based progress UI while generating
  const [nowMs, setNowMs] = useState<number>(() => Date.now())
  useEffect(() => {
    if (!isGenerating) return
    const id = setInterval(() => setNowMs(Date.now()), 200)
    return () => clearInterval(id)
  }, [isGenerating])
  const percent = computeDeterministicProgress(startedAt, etaSeconds, nowMs)
  const remaining = startedAt && etaSeconds
    ? Math.max(1, Math.ceil(etaSeconds - (nowMs - new Date(startedAt).getTime()) / 1000))
    : undefined

  const renderMenuItems = () => (
    <>
      <ContextMenuItem onClick={() => { if (sound) onPlaySound?.(sound) }}>
        {isPlaying && isCurrentTrack ? (
          <Pause className="h-4 w-4 mr-2" />
        ) : (
          <Play className="h-4 w-4 mr-2" />
        )}
        {isPlaying && isCurrentTrack ? 'Pause' : 'Play'}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => { if (sound) onCopyUrl?.(sound.url) }}>
        <Copy className="h-4 w-4 mr-2" />
        Copy URL
      </ContextMenuItem>
      {sound?.metadata?.prompt && (
        <ContextMenuItem onClick={() => {
          navigator.clipboard.writeText(sound.metadata!.prompt!)
          toast.success('Prompt copied to clipboard')
        }}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Prompt
        </ContextMenuItem>
      )}
      <ContextMenuItem 
        onClick={(e) => { e.stopPropagation(); if (sound) onDeleteSound?.(sound.id) }}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Remove
      </ContextMenuItem>
    </>
  )

  const renderDropdownItems = () => (
    <>
      <DropdownMenuItem onClick={() => { if (sound) onCopyUrl?.(sound.url) }}>
        <Copy className="h-4 w-4 mr-2" />
        Copy URL
      </DropdownMenuItem>
      {sound?.metadata?.prompt && (
        <DropdownMenuItem onClick={() => {
          navigator.clipboard.writeText(sound.metadata!.prompt!)
          toast.success('Prompt copied to clipboard')
        }}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Prompt
        </DropdownMenuItem>
      )}
      <DropdownMenuItem 
        onClick={(e) => { e.stopPropagation(); if (sound) onDeleteSound?.(sound.id) }}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Remove
      </DropdownMenuItem>
    </>
  )

  return (
    <div className={cn(
      "flex",
      isUser && "justify-end"
    )}>
      <div className={cn(
        "max-w-full sm:max-w-md w-full",
        isUser && "w-fit ml-auto"
      )}>
        {content && (
          <div className={cn(
            "rounded-2xl px-3 py-2",
            isUser 
              ? "bg-blue-500 text-white rounded-full ml-auto" 
              : "bg-black/5 dark:bg-white/5 border border-border/30"
          )}>
            {isGenerating && (
              <div className="flex items-center gap-2 text-xs opacity-80">
                <Loader2 className="h-3 w-3 animate-spin" />
                Generating... {percent}%
              </div>
            )}
            <p className="text-sm leading-relaxed">{content}</p>
            {isGenerating && (
              <div className="mt-2">
                <div className="flex items-center justify-between gap-3">
                  <Progress 
                    value={percent} 
                    className={cn(
                      "h-1 flex-1",
                      isUser ? "bg-white/20" : "bg-muted"
                    )}
                  />
                  {typeof remaining === 'number' && (
                    <span className="text-[10px] tabular-nums opacity-70 min-w-[42px] text-right">
                      ~{remaining}s
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Deterministic skeleton card while generating */}
        {isGenerating && !sound && (
          <div className="rounded-2xl border border-border py-3 bg-card max-w-md w-full flex flex-col gap-4 sm:gap-6 mt-3">
            <div className="flex px-3 gap-2 justify-between items-center">
              <h4 className="font-medium font-mono tracking-tight text-xs opacity-75 truncate">Preparing sound…</h4>
              <Badge className="bg-neutral-800 dark:bg-neutral-700 text-neutral-300 border-0 text-xs px-4 py-0.5">sfx</Badge>
            </div>
            <div className="border border-border bg-muted">
              <WaveformPreview url={"about:blank"} height={waveformHeight} approxDuration={typeof etaSeconds === 'number' ? Math.max(2, etaSeconds) : 8} />
            </div>
            <div className="flex items-center justify-between px-3 pb-1">
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Finalizing…
              </div>
            </div>
          </div>
        )}

        {sound && (
          <ContextMenu>
            <ContextMenuTrigger>
              <div className="rounded-2xl border border-border py-3 bg-card max-w-md w-full flex flex-col gap-4 sm:gap-6">
                {/* Header */}
                <div className="flex px-3 gap-2 justify-between items-center">
                  <h4 className="font-medium font-mono tracking-tight text-xs opacity-75 truncate">{sound.title}</h4>
                  <Badge className="bg-neutral-800 dark:bg-neutral-700 text-neutral-300 border-0 text-xs px-4 py-0.5">
                    {sound.metadata?.model?.includes('tts') ? 'tts' : 'sfx'}
                  </Badge>
                </div>
                {/* Waveform */}
                <div className="border border-border bg-muted">
                  <WaveformPreview url={sound.url} trackKey={sound.key} height={waveformHeight} approxDuration={sound.duration} />
                </div>
                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 px-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={e => {
                        e.stopPropagation()
                        onPlaySound?.(sound)
                      }}
                      className={cn(
                        "h-8 w-8 p-0",
                        isCurrentTrack && isPlaying
                          ? "text-primary dark:text-white"
                          : "text-neutral-900 dark:text-neutral-100"
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
                  <div className="flex items-center px-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      asChild
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                    >
                      <a target="_blank" href={sound.url} download>
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
                        {renderDropdownItems()}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-44">
              {renderMenuItems()}
            </ContextMenuContent>
          </ContextMenu>
        )}
      </div>
    </div>
  )
} 