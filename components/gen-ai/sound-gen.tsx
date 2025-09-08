'use client';

import { useAtom } from 'jotai';
import { Clock, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Slider } from '@/components/ui/slider';
import { useGenerationActions } from '@/hooks/data/use-generations';
import { WELCOME_MESSAGE } from '@/lib/constants/prompts';
import { cn } from '@/lib/utils';
import {
  currentTrackAtom,
  isGeneratingAtom,
  playerControlsAtom,
  playerStateAtom,
} from '@/state/audio-atoms';
import type { GeneratedSound } from '@/types/generations';
import { ChatMessages } from './chat-messages';
import { InputArea } from './input-area';

type SoundGeneratorProps = {
  className?: string;
};

type ChatMessage = {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content?: string;
  sound?: GeneratedSound;
  timestamp: Date;
  isGenerating?: boolean;
  etaSeconds?: number;
};

export function SoundGenerator({ className }: SoundGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isTTSMode, setIsTTSMode] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState<number>(10);
  const [promptInfluence, setPromptInfluence] = useState<number>(0.3);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      content: WELCOME_MESSAGE,
      timestamp: new Date(),
    },
  ]);
  const { generateSfx, generateTts, isPending } = useGenerationActions();

  const [isGenerating] = useAtom(isGeneratingAtom);
  // generationProgress is not used in the new deterministic UI
  const [, dispatchPlayerAction] = useAtom(playerControlsAtom);
  const [currentTrack] = useAtom(currentTrackAtom);
  const [playerState] = useAtom(playerStateAtom);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe a sound to generate');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt.trim(),
      timestamp: new Date(),
    };

    // Simple ETA: requested duration + small overhead (2s)
    const etaSeconds = Math.max(
      2,
      Math.round((isTTSMode ? 4 : durationSeconds) + 2)
    );
    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: `Creating "${prompt.trim()}"...`,
      timestamp: new Date(),
      isGenerating: true,
      etaSeconds,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    const currentPrompt = prompt.trim();
    setPrompt('');

    dispatchPlayerAction({ type: 'START_GENERATION' });

    try {
      const data = isTTSMode
        ? await generateTts({ text: currentPrompt })
        : await generateSfx({
            prompt: currentPrompt,
            options: { durationSeconds, promptInfluence },
          });

      if (data) {
        dispatchPlayerAction({
          type: 'FINISH_GENERATION',
          payload: data,
        });

        dispatchPlayerAction({
          type: 'PLAY_TRACK',
          payload: data,
        });

        // Replace loading message with result
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === loadingMessage.id
              ? {
                  ...msg,
                  content: undefined,
                  sound: data,
                  isGenerating: false,
                }
              : msg
          )
        );

        toast.success(
          `${isTTSMode ? 'Speech' : 'Sound'} generated successfully!`
        );
      } else {
        dispatchPlayerAction({ type: 'ERROR' });
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === loadingMessage.id
              ? {
                  ...msg,
                  content: `Sorry, I couldn't generate that ${isTTSMode ? 'speech' : 'sound'}. Please try a different description.`,
                  isGenerating: false,
                }
              : msg
          )
        );
        toast.error('Failed to generate');
      }
    } catch (_error) {
      dispatchPlayerAction({ type: 'ERROR' });
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessage.id
            ? {
                ...msg,
                content:
                  'An error occurred while generating. Please try again.',
                isGenerating: false,
              }
            : msg
        )
      );
      toast.error('An unexpected error occurred');
    }
  };

  const handlePlaySound = (sound: GeneratedSound) => {
    // Route through /api/audio/[key] if not offline/local
    let url = sound.url;
    if (!url || (url.startsWith('https://') && !url.startsWith('blob:'))) {
      url = `/api/audio/${encodeURIComponent(sound.key)}`;
    }
    // Play the track with the correct url
    const track = { ...sound, url };
    if (currentTrack?.id === sound.id && playerState === 'playing') {
      dispatchPlayerAction({ type: 'PAUSE' });
    } else {
      dispatchPlayerAction({ type: 'PLAY_TRACK', payload: track });
    }
  };

  const handleDeleteSound = (soundId: string) => {
    dispatchPlayerAction({ type: 'REMOVE_FROM_QUEUE', payload: soundId });
    toast.success('Sound removed');
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const isLoading = isGenerating || isPending;

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <ChatMessages
        messages={messages}
        onCopyUrl={handleCopyUrl}
        onDeleteSound={handleDeleteSound}
        onPlaySound={handlePlaySound}
      />
      <InputArea
        extraControls={
          <div className="flex items-center gap-3 text-neutral-300 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 opacity-70" />
              <Slider
                className="w-28"
                max={22}
                min={0.1}
                onValueChange={(v) => setDurationSeconds(Number(v[0]))}
                step={0.1}
                value={[durationSeconds]}
              />
              <span className="w-10 text-right tabular-nums">
                {durationSeconds.toFixed(1)}s
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 opacity-70" />
              <Slider
                className="w-24"
                max={1}
                min={0}
                onValueChange={(v) => setPromptInfluence(Number(v[0]))}
                step={0.05}
                value={[promptInfluence]}
              />
              <span className="w-8 text-right tabular-nums">
                {Math.round(promptInfluence * 100)}%
              </span>
            </div>
          </div>
        }
        isLoading={isLoading}
        isTTSMode={isTTSMode}
        onGenerate={handleGenerate}
        prompt={prompt}
        setIsTTSMode={setIsTTSMode}
        // simple controls; integrate properly with your UI later
        setPrompt={setPrompt}
      />
    </div>
  );
}

export default SoundGenerator;
