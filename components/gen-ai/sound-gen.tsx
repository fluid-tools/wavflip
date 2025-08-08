'use client'

import { useState, useTransition } from 'react'
import { useAtom } from 'jotai'
import { generateSoundEffect, generateTextToSpeech } from '@/actions/generate-sound'
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
}

export function SoundGenerator({ className }: SoundGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [isTTSMode, setIsTTSMode] = useState(false)
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
      />
    </div>
  )
}

export default SoundGenerator