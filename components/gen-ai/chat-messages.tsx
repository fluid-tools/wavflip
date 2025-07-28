'use client'

import { useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage } from './chat-message'
import { cn } from '@/lib/utils'
import { MUSIC_PROMPTS } from '@/lib/constants/prompts'
import type { GeneratedSound } from '@/types/audio'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content?: string
  sound?: GeneratedSound
  timestamp: Date
  isGenerating?: boolean
}

interface ChatMessagesProps {
  messages: ChatMessage[]
  generationProgress: number
  onPlaySound: (sound: GeneratedSound) => void
  onDeleteSound: (soundId: string) => void
  onCopyUrl: (url: string) => void
  className?: string
}

export function ChatMessages({
  messages,
  generationProgress,
  onPlaySound,
  onDeleteSound,
  onCopyUrl,
  className
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className={cn("flex-1 min-h-0 relative", className)}>
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

      {/* Chat Messages - Scrollable area */}
      <div className="relative z-10 h-full">
        <ScrollArea className="h-full">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                type={message.type}
                content={message.content}
                sound={message.sound}
                isGenerating={message.isGenerating}
                generationProgress={generationProgress}
                onPlaySound={onPlaySound}
                onDeleteSound={onDeleteSound}
                onCopyUrl={onCopyUrl}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>
    </div>
  )
} 