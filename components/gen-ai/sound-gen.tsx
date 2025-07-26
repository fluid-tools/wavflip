'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useAtom } from 'jotai'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Loader2, Wand2, Mic, Play, Download, MoreHorizontal, Copy, Trash2, Sparkles, Send, User, Bot, Clock, Music, Volume2, History } from 'lucide-react'
import { generateSoundEffect, generateTextToSpeech } from '@/actions/generate-sound'
import { 
  isGeneratingAtom, 
  generationProgressAtom, 
  playerControlsAtom,
  generatedSoundsAtom 
} from '@/state/audio-atoms'
import type { GeneratedSound } from '@/types/audio'
import { downloadAndStoreAudio } from '@/lib/storage/library-storage'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { WaveformPreview } from '@/components/player/waveform-preview'

interface SoundGeneratorProps {
  className?: string
}

interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content?: string
  sound?: GeneratedSound
  timestamp: Date
  isGenerating?: boolean
}

const MUSIC_PROMPTS = [
  "Lo-fi hip hop beat",
  "Trap 808 drums",
  "Jazz piano melody",
  "Synthwave arpeggios", 
  "Acoustic guitar riff",
  "Deep house bassline",
  "Orchestral strings",
  "Vintage vinyl crackle",
  "Boom bap drums",
  "Ambient pad sounds",
  "Reggaeton percussion",
  "Gospel organ chords",
  "Techno kick pattern",
  "R&B vocal harmonies",
  "Rock guitar solo",
  "Latin brass section",
  "Drum and bass breaks",
  "Country banjo picking",
  "Electronic glitch sounds",
  "Soul bass guitar"
]

export function SoundGenerator({ className }: SoundGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [isTTSMode, setIsTTSMode] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      content: "Welcome to AI Studio! I can create any sound or beat you describe. Try something like 'lo-fi hip hop beat' or switch to TTS mode for voice generation.",
      timestamp: new Date()
    }
  ])
  const [isPending, startTransition] = useTransition()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const [isGenerating] = useAtom(isGeneratingAtom)
  const [generationProgress] = useAtom(generationProgressAtom)
  const [, dispatchPlayerAction] = useAtom(playerControlsAtom)
  const [generatedSounds] = useAtom(generatedSoundsAtom)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error('Please describe a sound to generate')
      return
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt.trim(),
      timestamp: new Date()
    }

    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: `Creating "${prompt.trim()}"...`,
      timestamp: new Date(),
      isGenerating: true
    }

    setMessages(prev => [...prev, userMessage, loadingMessage])
    const currentPrompt = prompt.trim()
    setPrompt('')

    startTransition(async () => {
      dispatchPlayerAction({ type: 'START_GENERATION' })
      
      try {
        const result = isTTSMode 
          ? await generateTextToSpeech(currentPrompt)
          : await generateSoundEffect(currentPrompt)
        
        if (result.success && result.data) {
          dispatchPlayerAction({ 
            type: 'FINISH_GENERATION', 
            payload: result.data 
          })
          
          dispatchPlayerAction({ 
            type: 'PLAY_TRACK', 
            payload: result.data 
          })
          
          try {
            await downloadAndStoreAudio(result.data)
          } catch (error) {
            console.error('Failed to save to library:', error)
          }

          // Replace loading message with result
          setMessages(prev => prev.map(msg => 
            msg.id === loadingMessage.id 
              ? {
                  ...msg,
                  content: undefined,
                  sound: result.data,
                  isGenerating: false
                }
              : msg
          ))
          
          toast.success(`${isTTSMode ? 'Speech' : 'Sound'} generated successfully!`)
        } else {
          dispatchPlayerAction({ type: 'ERROR' })
          setMessages(prev => prev.map(msg => 
            msg.id === loadingMessage.id 
              ? {
                  ...msg,
                  content: `Sorry, I couldn't generate that ${isTTSMode ? 'speech' : 'sound'}. Please try a different description.`,
                  isGenerating: false
                }
              : msg
          ))
          toast.error(result.error || 'Failed to generate')
        }
      } catch (error) {
        dispatchPlayerAction({ type: 'ERROR' })
        setMessages(prev => prev.map(msg => 
          msg.id === loadingMessage.id 
            ? {
                ...msg,
                content: "An error occurred while generating. Please try again.",
                isGenerating: false
              }
            : msg
        ))
        toast.error('An unexpected error occurred')
        console.error('Generation error:', error)
      }
    })
  }

  const handlePromptClick = (promptText: string) => {
    setPrompt(promptText)
    textareaRef.current?.focus()
  }

  const handlePlaySound = (sound: GeneratedSound) => {
    dispatchPlayerAction({ type: 'PLAY_TRACK', payload: sound })
  }

  const handleDeleteSound = (soundId: string) => {
    dispatchPlayerAction({ type: 'REMOVE_FROM_PLAYLIST', payload: soundId })
    toast.success('Sound removed')
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copied to clipboard')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleGenerate()
    }
  }

  const isLoading = isPending || isGenerating

  return (
    <div className={cn("h-full flex flex-col relative", className)}>
      {/* Floating Background Prompts */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {MUSIC_PROMPTS.map((promptText, index) => (
          <div
            key={index}
            className="absolute text-muted-foreground/8 text-sm font-medium select-none"
            style={{
              top: `${15 + (index * 37) % 70}%`,
              left: `${10 + (index * 43) % 80}%`,
              transform: `rotate(${-20 + (index * 15) % 40}deg)`,
              fontSize: `${12 + (index % 4) * 2}px`
            }}
          >
            {promptText}
          </div>
        ))}
      </div>

      {/* Chat Messages - ONLY scrollable area using ScrollArea */}
      <div className="flex-1 min-h-0 relative z-10">
        <ScrollArea className="h-full">
          <div className="max-w-4xl mx-auto px-8 py-12 space-y-8">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-6 items-start",
                  message.type === 'user' && "flex-row-reverse"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 shadow-sm",
                  message.type === 'user' && "bg-primary text-primary-foreground",
                  message.type === 'assistant' && "bg-violet-100 text-violet-600",
                  message.type === 'system' && "bg-muted text-muted-foreground"
                )}>
                  {message.type === 'user' && <User className="h-4 w-4" />}
                  {message.type === 'assistant' && <Bot className="h-4 w-4" />}
                  {message.type === 'system' && <Sparkles className="h-4 w-4" />}
                </div>

                {/* Message Content */}
                <div className={cn(
                  "flex-1 max-w-[75%]",
                  message.type === 'user' && "flex justify-end"
                )}>
                  <div className={cn(
                    "rounded-2xl px-5 py-4 shadow-sm",
                    message.type === 'user' && "bg-primary text-primary-foreground",
                    message.type === 'assistant' && "bg-muted/50 border",
                    message.type === 'system' && "bg-muted/30 border text-center"
                  )}>
                    {message.content && (
                      <div className="space-y-3">
                        {message.isGenerating && (
                          <div className="flex items-center gap-2 text-sm">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Generating... {Math.round(generationProgress * 100)}%
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        {message.isGenerating && (
                          <Progress value={generationProgress * 100} className="h-1.5" />
                        )}
                      </div>
                    )}

                    {message.sound && (
                      <ContextMenu>
                        <ContextMenuTrigger>
                          <div className="bg-background/90 backdrop-blur-sm rounded-xl p-5 border hover:bg-background/95 transition-all cursor-pointer shadow-sm">
                            <div className="flex items-start gap-4">
                              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex-shrink-0 shadow-sm">
                                {message.sound.metadata?.model?.includes('tts') ? (
                                  <Volume2 className="h-6 w-6 text-primary" />
                                ) : (
                                  <Music className="h-6 w-6 text-primary" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-base mb-2">{message.sound.title}</h4>
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                                  {message.sound.metadata?.prompt}
                                </p>
                                
                                {/* Waveform Preview */}
                                <div className="mb-4">
                                  <WaveformPreview url={message.sound.url} height={35} />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{new Date(message.sound.createdAt).toLocaleTimeString()}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {message.sound.metadata?.model?.replace('elevenlabs-', '')}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handlePlaySound(message.sound!)}
                                      className="h-9 w-9 p-0 hover:bg-primary/10"
                                    >
                                      <Play className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      asChild
                                      className="h-9 w-9 p-0 hover:bg-primary/10"
                                    >
                                      <a href={message.sound.url} download>
                                        <Download className="h-4 w-4" />
                                      </a>
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button 
                                          size="sm" 
                                          variant="ghost" 
                                          className="h-9 w-9 p-0 hover:bg-primary/10"
                                        >
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-40">
                                        <DropdownMenuItem onClick={() => handleCopyUrl(message.sound!.url)}>
                                          <Copy className="h-4 w-4 mr-2" />
                                          Copy URL
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => handleDeleteSound(message.sound!.id)}
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
                            </div>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-40">
                          <ContextMenuItem onClick={() => handlePlaySound(message.sound!)}>
                            <Play className="h-4 w-4 mr-2" />
                            Play
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => handleCopyUrl(message.sound!.url)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy URL
                          </ContextMenuItem>
                          <ContextMenuItem 
                            onClick={() => handleDeleteSound(message.sound!.id)}
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
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Fixed Input Area - ABSOLUTELY CANNOT SCROLL */}
      <div className="flex-shrink-0 bg-background border-t">
        <div className="max-w-4xl mx-auto p-6">
          {/* Mode Toggle & Recent Generations Sheet */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  checked={isTTSMode}
                  onCheckedChange={setIsTTSMode}
                />
                <span className="text-sm font-medium">
                  {isTTSMode ? 'Text-to-Speech' : 'Sound Generation'}
                </span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {isTTSMode ? <Volume2 className="h-4 w-4" /> : <Music className="h-4 w-4" />}
                <span>{isTTSMode ? 'Voice Mode' : 'Music Mode'}</span>
              </div>
            </div>

            {/* Recent Generations Sheet Trigger */}
            {generatedSounds.length > 0 && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <History className="h-4 w-4" />
                    Recent ({generatedSounds.length})
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Recent Generations</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-full mt-6">
                    <div className="space-y-3">
                      {generatedSounds.slice(0, 20).map((sound) => (
                        <div 
                          key={sound.id}
                          className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer space-y-3"
                          onClick={() => handlePlaySound(sound)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 flex-shrink-0">
                              {sound.metadata?.model?.includes('tts') ? (
                                <Volume2 className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <Music className="h-3.5 w-3.5 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{sound.title}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {sound.metadata?.prompt}
                              </p>
                            </div>
                            <Play className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <WaveformPreview url={sound.url} height={25} />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            )}
          </div>

          {/* Prompt Suggestions */}
          {prompt === '' && !isTTSMode && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {MUSIC_PROMPTS.slice(0, 6).map((promptText, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptClick(promptText)}
                    className="px-3 py-1.5 text-sm bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex items-end gap-3 p-3 bg-muted/30 rounded-2xl border">
            <Textarea
              ref={textareaRef}
              placeholder={isTTSMode ? "Enter text to convert to speech..." : "Describe a sound, beat, or musical element..."}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1 min-h-[20px] max-h-[100px] resize-none border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/60"
              rows={1}
            />
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-xs text-muted-foreground">
                {prompt.length}/{isTTSMode ? 2500 : 500}
              </div>
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                className="h-8 w-8 p-0 rounded-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SoundGenerator