'use client';

import { useAtom } from 'jotai';
import {
  Copy,
  Download,
  Loader2,
  MoreHorizontal,
  Pause,
  Play,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { WaveformPreview } from '@/components/player/waveform-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { currentTrackAtom, playerStateAtom } from '@/state/audio-atoms';
import type { GeneratedSound } from '@/types/generations';

const MILLISECONDS_TO_SECONDS = 1000;
const MIN_SOUND_DURATION_SECONDS = 2;
const DEFAULT_SOUND_DURATION_SECONDS = 8;

// Custom hook for managing progress calculation
function useProgressCalculation(
  isGenerating: boolean,
  startedAt?: Date,
  etaSeconds?: number
) {
  const PROGRESS_UPDATE_INTERVAL_MS = 200;
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!isGenerating) {
      return;
    }
    const id = setInterval(
      () => setNowMs(Date.now()),
      PROGRESS_UPDATE_INTERVAL_MS
    );
    return () => clearInterval(id);
  }, [isGenerating]);

  const percent = computeDeterministicProgress(startedAt, etaSeconds, nowMs);
  const remaining =
    startedAt && etaSeconds
      ? Math.max(
          1,
          Math.ceil(
            etaSeconds -
              (nowMs - new Date(startedAt).getTime()) / MILLISECONDS_TO_SECONDS
          )
        )
      : undefined;

  return { percent, remaining };
}

function computeDeterministicProgress(
  startedAt?: Date,
  etaSeconds?: number,
  nowMs?: number
): number {
  const PERCENTAGE_MULTIPLIER = 100;

  if (!(startedAt && etaSeconds) || etaSeconds <= 0) {
    return 0;
  }
  const now = typeof nowMs === 'number' ? nowMs : Date.now();
  const elapsed =
    (now - new Date(startedAt).getTime()) / MILLISECONDS_TO_SECONDS;
  const pct = Math.max(0, Math.min(1, elapsed / etaSeconds));
  return Math.round(pct * PERCENTAGE_MULTIPLIER);
}

type ChatMessageProps = {
  type: 'user' | 'assistant' | 'system';
  content?: string;
  sound?: GeneratedSound;
  isGenerating?: boolean;
  etaSeconds?: number;
  startedAt?: Date;
  onPlaySound?: (sound: GeneratedSound) => void;
  onDeleteSound?: (soundId: string) => void;
  onCopyUrl?: (url: string) => void;
};

export function ChatMessage({
  type,
  content,
  sound,
  isGenerating = false,
  etaSeconds,
  startedAt,
  onPlaySound,
  onDeleteSound,
  onCopyUrl,
}: ChatMessageProps) {
  const isUser = type === 'user';

  const [currentTrack] = useAtom(currentTrackAtom);
  const [playerState] = useAtom(playerStateAtom);

  const isCurrentTrack = currentTrack?.id === sound?.id;
  const isPlaying = playerState === 'playing' && isCurrentTrack;

  const isMobile = useIsMobile();
  const WAVEFORM_HEIGHT_MOBILE = 32;
  const WAVEFORM_HEIGHT_DESKTOP = 48;
  const waveformHeight = isMobile
    ? WAVEFORM_HEIGHT_MOBILE
    : WAVEFORM_HEIGHT_DESKTOP;

  const { percent, remaining } = useProgressCalculation(
    isGenerating,
    startedAt,
    etaSeconds
  );

  const renderMessageContent = () =>
    content && (
      <div
        className={cn(
          'rounded-2xl px-3 py-2',
          isUser
            ? 'ml-auto rounded-full bg-blue-500 text-white'
            : 'border border-border/30 bg-black/5 dark:bg-white/5'
        )}
      >
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
                className={cn(
                  'h-1 flex-1',
                  isUser ? 'bg-white/20' : 'bg-muted'
                )}
                value={percent}
              />
              {typeof remaining === 'number' && (
                <span className="min-w-[42px] text-right text-[10px] tabular-nums opacity-70">
                  ~{remaining}s
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );

  const renderGeneratingSkeleton = () =>
    isGenerating &&
    !sound && (
      <div className="mt-3 flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border bg-card py-3 sm:gap-6">
        <div className="flex items-center justify-between gap-2 px-3">
          <h4 className="truncate font-medium font-mono text-xs tracking-tight opacity-75">
            Preparing sound…
          </h4>
          <Badge className="border-0 bg-neutral-800 px-4 py-0.5 text-neutral-300 text-xs dark:bg-neutral-700">
            sfx
          </Badge>
        </div>
        <div className="border border-border bg-muted">
          <WaveformPreview
            approxDuration={
              typeof etaSeconds === 'number'
                ? Math.max(MIN_SOUND_DURATION_SECONDS, etaSeconds)
                : DEFAULT_SOUND_DURATION_SECONDS
            }
            height={waveformHeight}
            url={'about:blank'}
          />
        </div>
        <div className="flex items-center justify-between px-3 pb-1">
          <div className="flex items-center gap-2 text-neutral-400 text-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Finalizing…
          </div>
        </div>
      </div>
    );

  const renderMenuItems = () => {
    const playPauseItem = (
      <ContextMenuItem
        onClick={() => {
          if (sound) {
            onPlaySound?.(sound);
          }
        }}
      >
        {isPlaying && isCurrentTrack ? (
          <Pause className="mr-2 h-4 w-4" />
        ) : (
          <Play className="mr-2 h-4 w-4" />
        )}
        {isPlaying && isCurrentTrack ? 'Pause' : 'Play'}
      </ContextMenuItem>
    );

    const copyUrlItem = (
      <ContextMenuItem
        onClick={() => {
          if (sound) {
            onCopyUrl?.(sound.url);
          }
        }}
      >
        <Copy className="mr-2 h-4 w-4" />
        Copy URL
      </ContextMenuItem>
    );

    const copyPromptItem = sound?.metadata?.prompt && (
      <ContextMenuItem
        onClick={() => {
          navigator.clipboard.writeText(sound.metadata.prompt);
          toast.success('Prompt copied to clipboard');
        }}
      >
        <Copy className="mr-2 h-4 w-4" />
        Copy Prompt
      </ContextMenuItem>
    );

    const deleteItem = (
      <ContextMenuItem
        className="text-destructive focus:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          if (sound) {
            onDeleteSound?.(sound.id);
          }
        }}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Remove
      </ContextMenuItem>
    );

    return (
      <>
        {playPauseItem}
        {copyUrlItem}
        {copyPromptItem}
        {deleteItem}
      </>
    );
  };

  const renderDropdownItems = () => {
    const copyUrlItem = (
      <DropdownMenuItem
        onClick={() => {
          if (sound) {
            onCopyUrl?.(sound.url);
          }
        }}
      >
        <Copy className="mr-2 h-4 w-4" />
        Copy URL
      </DropdownMenuItem>
    );

    const copyPromptItem = sound?.metadata?.prompt && (
      <DropdownMenuItem
        onClick={() => {
          navigator.clipboard.writeText(sound.metadata.prompt);
          toast.success('Prompt copied to clipboard');
        }}
      >
        <Copy className="mr-2 h-4 w-4" />
        Copy Prompt
      </DropdownMenuItem>
    );

    const deleteItem = (
      <DropdownMenuItem
        className="text-destructive focus:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          if (sound) {
            onDeleteSound?.(sound.id);
          }
        }}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Remove
      </DropdownMenuItem>
    );

    return (
      <>
        {copyUrlItem}
        {copyPromptItem}
        {deleteItem}
      </>
    );
  };

  const renderSoundCard = () => {
    if (!sound) {
      return null;
    }

    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border bg-card py-3 sm:gap-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 px-3">
              <h4 className="truncate font-medium font-mono text-xs tracking-tight opacity-75">
                {sound.title}
              </h4>
              <Badge className="border-0 bg-neutral-800 px-4 py-0.5 text-neutral-300 text-xs dark:bg-neutral-700">
                {sound.metadata?.model?.includes('tts') ? 'tts' : 'sfx'}
              </Badge>
            </div>
            {/* Waveform */}
            <div className="border border-border bg-muted">
              <WaveformPreview
                approxDuration={sound.duration}
                height={waveformHeight}
                trackKey={sound.key}
                url={sound.url}
              />
            </div>
            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-3">
                <Button
                  className={cn(
                    'h-8 w-8 p-0',
                    isCurrentTrack && isPlaying
                      ? 'text-primary dark:text-white'
                      : 'text-neutral-900 dark:text-neutral-100'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlaySound?.(sound);
                  }}
                  size="icon"
                  variant="ghost"
                >
                  {isPlaying && isCurrentTrack ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="ml-0.5 h-4 w-4" />
                  )}
                </Button>
                <span className="text-neutral-400 text-xs">
                  {sound.duration ? `${Math.round(sound.duration)}s` : ''}
                </span>
              </div>
              <div className="flex items-center px-3">
                <Button
                  asChild
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                  size="icon"
                  variant="ghost"
                >
                  <a download href={sound.url} target="_blank">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="h-8 w-8 p-0 text-neutral-400 hover:text-white"
                      size="icon"
                      variant="ghost"
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
    );
  };

  return (
    <div className={cn('flex', isUser && 'justify-end')}>
      <div
        className={cn(
          'w-full max-w-full sm:max-w-md',
          isUser && 'ml-auto w-fit'
        )}
      >
        {renderMessageContent()}
        {renderGeneratingSkeleton()}
        {renderSoundCard()}
      </div>
    </div>
  );
}
