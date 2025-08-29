'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MUSIC_PROMPTS } from '@/lib/constants/prompts';
import { cn } from '@/lib/utils';
import type { GeneratedSound } from '@/types/generations';
import { ChatMessage } from './chat-message';

type ChatMessageT = {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content?: string;
  sound?: GeneratedSound;
  timestamp: Date;
  isGenerating?: boolean;
  etaSeconds?: number;
};

type ChatMessagesProps = {
  messages: ChatMessageT[];
  onPlaySound: (sound: GeneratedSound) => void;
  onDeleteSound: (soundId: string) => void;
  onCopyUrl: (url: string) => void;
  className?: string;
};

export function ChatMessages({
  messages,
  onPlaySound,
  onDeleteSound,
  onCopyUrl,
  className,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  return (
    <div className={cn('relative min-h-0 flex-1', className)}>
      {/* Floating Background Prompts */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {MUSIC_PROMPTS.map((promptText, index) => (
          <div
            className="absolute select-none font-medium text-muted-foreground/8 text-sm"
            key={index}
            style={{
              top: `${15 + ((index * 37) % 70)}%`, // eslint-disable-line
              left: `${10 + ((index * 43) % 80)}%`, // eslint-disable-line
              transform: `rotate(${-20 + ((index * 15) % 40)}deg)`, // eslint-disable-line
              fontSize: `${12 + (index % 4) * 2}px`, // eslint-disable-line
            }}
          >
            {promptText}
          </div>
        ))}
      </div>

      {/* Chat Messages - Scrollable area */}
      <div className="relative z-10 h-full">
        <ScrollArea className="h-full">
          <div className="mx-auto max-w-4xl space-y-8 px-4 py-6 sm:space-y-10">
            {messages.map((message) => (
              <ChatMessage
                content={message.content}
                etaSeconds={message.etaSeconds}
                isGenerating={message.isGenerating}
                key={message.id}
                onCopyUrl={onCopyUrl}
                onDeleteSound={onDeleteSound}
                onPlaySound={onPlaySound}
                sound={message.sound}
                startedAt={message.timestamp}
                type={message.type}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
