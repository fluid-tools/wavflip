'use client'

import { useState, useTransition } from 'react'
import { useAtom } from 'jotai'
import { generateSoundEffect } from '@/actions/generate/sound'
import { generateTextToSpeech } from '@/actions/generate/speech'
import { 
  isGeneratingAtom, 
  generationProgressAtom, 
  playerControlsAtom,
  currentTrackAtom,
  playerStateAtom
} from '@/state/audio-atoms'
import { useGenerations } from '@/hooks/data/use-generations'
import { WELCOME_MESSAGE } from '@/lib/constants/prompts'
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import { Clock, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { ChatMessages } from './chat-messages'
import { InputArea } from './input-area'
import type { GeneratedSound } from '@/types/audio'

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
  etaSeconds?: number
}

export function SoundGenerator({ className }: SoundGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [isTTSMode, setIsTTSMode] = useState(false)
  const [durationSeconds, setDurationSeconds] = useState<number>(10)
  const [promptInfluence, setPromptInfluence] = useState<number>(0.3)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      content: WELCOME_MESSAGE,
      timestamp: new Date()
    }
  ])
  const [isPending, startTransition] = useTransition()
  
  const [isGenerating] = useAtom(isGeneratingAtom)
  const [generationProgress] = useAtom(generationProgressAtom)
  const [, dispatchPlayerAction] = useAtom(playerControlsAtom)
  const [currentTrack] = useAtom(currentTrackAtom)
  const [playerState] = useAtom(playerStateAtom)
  const { addToSession } = useGenerations()

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

    // Simple ETA: requested duration + small overhead (2s)
    const etaSeconds = Math.max(2, Math.round((isTTSMode ? 4 : durationSeconds) + 2))
    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: `Creating "${prompt.trim()}"...`,
      timestamp: new Date(),
      isGenerating: true,
      etaSeconds
    }

    setMessages(prev => [...prev, userMessage, loadingMessage])
    const currentPrompt = prompt.trim()
    setPrompt('')

    startTransition(async () => {
      dispatchPlayerAction({ type: 'START_GENERATION' })
      
      try {
        const result = isTTSMode 
          ? await generateTextToSpeech(currentPrompt)
          : await generateSoundEffect(currentPrompt, { durationSeconds, promptInfluence })
        
        if (result.success && result.data) {
          dispatchPlayerAction({ 
            type: 'FINISH_GENERATION', 
            payload: result.data 
          })
          
          dispatchPlayerAction({ 
            type: 'PLAY_TRACK', 
            payload: result.data 
          })
          
          // Add to session for offline access
          addToSession(result.data)

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

  const handlePlaySound = (sound: GeneratedSound) => {
    // Route through /api/audio/[key] if not offline/local
    let url = sound.url
    if (!url || (url.startsWith('https://') && !url.startsWith('blob:'))) {
      url = `/api/audio/${encodeURIComponent(sound.key)}`
    }
    // Play the track with the correct url
    const track = { ...sound, url }
    if (currentTrack?.id === sound.id && playerState === 'playing') {
      dispatchPlayerAction({ type: 'PAUSE' })
    } else {
      dispatchPlayerAction({ type: 'PLAY_TRACK', payload: track })
    }
  }

  const handleDeleteSound = (soundId: string) => {
    dispatchPlayerAction({ type: 'REMOVE_FROM_QUEUE', payload: soundId })
    toast.success('Sound removed')
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copied to clipboard')
  }

  const isLoading = isPending || isGenerating

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <ChatMessages
        messages={messages}
        generationProgress={generationProgress}
        onPlaySound={handlePlaySound}
        onDeleteSound={handleDeleteSound}
        onCopyUrl={handleCopyUrl}
      />
      <InputArea
        prompt={prompt}
        setPrompt={setPrompt}
        isTTSMode={isTTSMode}
        setIsTTSMode={setIsTTSMode}
        isLoading={isLoading}
        onGenerate={handleGenerate}
        // simple controls; integrate properly with your UI later
        extraControls={
          <div className="flex items-center gap-3 text-xs text-neutral-300">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 opacity-70" />
              <Slider
                value={[durationSeconds]}
                min={0.1}
                max={22}
                step={0.1}
                onValueChange={(v)=> setDurationSeconds(Number(v[0]))}
                className="w-28"
              />
              <span className="w-10 tabular-nums text-right">{durationSeconds.toFixed(1)}s</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 opacity-70" />
              <Slider
                value={[promptInfluence]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={(v)=> setPromptInfluence(Number(v[0]))}
                className="w-24"
              />
              <span className="w-8 tabular-nums text-right">{Math.round(promptInfluence*100)}%</span>
            </div>
          </div>
        }
      />
    </div>
  )
}

export default SoundGenerator