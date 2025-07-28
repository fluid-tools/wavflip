'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Loader2, Send, Music, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MUSIC_PROMPTS } from '@/lib/constants/prompts'
import { RecentSheet } from './recent-sheet'
import type { GeneratedSound } from '@/types/audio'

interface InputAreaProps {
  prompt: string
  setPrompt: (prompt: string) => void
  isTTSMode: boolean
  setIsTTSMode: (mode: boolean) => void
  isLoading: boolean
  onGenerate: () => void
  onPlaySound: (sound: GeneratedSound) => void
  generatedSounds: GeneratedSound[]
  className?: string
}

export function InputArea({
  prompt,
  setPrompt,
  isTTSMode,
  setIsTTSMode,
  isLoading,
  onGenerate,
  onPlaySound,
  generatedSounds,
  className
}: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onGenerate()
    }
  }

  const handlePromptClick = (promptText: string) => {
    setPrompt(promptText)
    textareaRef.current?.focus()
  }

  return (
    <div className={cn("flex-shrink-0 bg-background/80 backdrop-blur-sm border-t", className)}>
      <div className="max-w-4xl mx-auto p-4">
        {/* Mode Toggle & Recent Generations Sheet */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={isTTSMode}
                onCheckedChange={setIsTTSMode}
                className="scale-90"
              />
              <span className="text-sm font-medium">
                {isTTSMode ? 'Text-to-Speech' : 'Sound Generation'}
              </span>
            </div>
            <Separator orientation="vertical" className="h-3" />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {isTTSMode ? <Volume2 className="h-3.5 w-3.5" /> : <Music className="h-3.5 w-3.5" />}
              <span>{isTTSMode ? 'Voice Mode' : 'Music Mode'}</span>
            </div>
          </div>

          {/* Recent Generations Sheet Trigger */}
          <RecentSheet 
            generatedSounds={generatedSounds}
            onPlaySound={onPlaySound}
          />
        </div>

        {/* Prompt Suggestions */}
        {prompt === '' && !isTTSMode && (
          <div className="mb-3">
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {MUSIC_PROMPTS.slice(0, 12).map((promptText, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptClick(promptText)}
                    className="flex-shrink-0 px-3 py-1.5 text-xs bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-all duration-200 hover:scale-105 whitespace-nowrap border border-border/40 hover:border-border/70"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="h-1" />
            </ScrollArea>
          </div>
        )}

        {/* Input */}
        <div className="flex items-end gap-2 p-2.5 bg-muted/40 rounded-xl border">
          <Textarea
            ref={textareaRef}
            placeholder={isTTSMode ? "Enter text to convert to speech..." : "Describe a sound, beat, or musical element..."}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1 min-h-[20px] max-h-[80px] resize-none border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/60 text-sm"
            rows={1}
          />
          
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="text-xs text-muted-foreground">
              {prompt.length}/{isTTSMode ? 2500 : 500}
            </div>
            <Button
              size="sm"
              onClick={onGenerate}
              disabled={isLoading || !prompt.trim()}
              className="h-7 w-7 p-0 rounded-full"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 