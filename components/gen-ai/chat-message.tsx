'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Loader2, Play, Download, MoreHorizontal, Copy, Trash2, Clock, Music, Volume2 } from 'lucide-react'
import { WaveformPreview } from '@/components/player/waveform-preview'
import { cn } from '@/lib/utils'
import type { GeneratedSound } from '@/types/audio'

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
                <div className="bg-background/90 backdrop-blur-sm rounded-xl p-2.5 border hover:bg-background/95 transition-all cursor-pointer mt-2">
                  <div className="flex items-start gap-2.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-violet-500/20 flex-shrink-0">
                      {sound.metadata?.model?.includes('tts') ? (
                        <Volume2 className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Music className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm mb-1">{sound.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                        {sound.metadata?.prompt}
                      </p>
                      
                      {/* Waveform Preview */}
                      <div className="mb-2.5">
                        <WaveformPreview url={sound.url} height={25} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(sound.createdAt).toLocaleTimeString()}</span>
                          <Badge variant="outline" className="text-xs h-3.5 px-1.5">
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
                            className="h-6 w-6 p-0 hover:bg-primary/10"
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            className="h-6 w-6 p-0 hover:bg-primary/10"
                          >
                            <a href={sound.url} download>
                              <Download className="h-3 w-3" />
                            </a>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0 hover:bg-primary/10"
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => onCopyUrl?.(sound.url)}>
                                <Copy className="h-3.5 w-3.5 mr-2" />
                                Copy URL
                              </DropdownMenuItem>
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
                      </div>
                    </div>
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-40">
                <ContextMenuItem onClick={() => onPlaySound?.(sound)}>
                  <Play className="h-4 w-4 mr-2" />
                  Play
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onCopyUrl?.(sound.url)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </ContextMenuItem>
                <ContextMenuItem 
                  onClick={() => onDeleteSound?.(sound.id)}
                  className="text-destructive focus:text-destructive"
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