'use client';

import { useAtom } from 'jotai';
import {
  Check,
  Copy,
  Download,
  HardDrive,
  History,
  MoreHorizontal,
  Music,
  Pause,
  Play,
  Trash2,
  Volume2,
  WifiOff,
} from 'lucide-react';
import { memo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { toast } from 'sonner';
import { WaveformPreview } from '@/components/player/waveform-preview';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useGenerations } from '@/hooks/data/use-generations';
import { cn } from '@/lib/utils';
import { currentTrackAtom, playerStateAtom } from '@/state/audio-atoms';
import type { GeneratedSound } from '@/types/generations';
import { StorageIndicator } from './storage-indicator';

type RecentSheetProps = {
  onPlaySound: (sound: GeneratedSound) => void;
};

// Memoized waveform component to prevent re-renders
const MemoizedWaveform = memo(function WaveformComponent({
  url,
  trackKey,
}: {
  url: string;
  trackKey?: string;
}) {
  return <WaveformPreview height={24} trackKey={trackKey} url={url} />;
});

export function RecentSheet({ onPlaySound }: RecentSheetProps) {
  const [currentTrack] = useAtom(currentTrackAtom);
  const [playerState] = useAtom(playerStateAtom);
  const {
    generations,
    isOnline,
    isLoading,
    saveOfflineAsync,
    removeOfflineAsync,
  } = useGenerations();
  const [savingOffline, setSavingOffline] = useState<string | null>(null);
  const [removingOffline, setRemovingOffline] = useState<string | null>(null);

  if (generations.length === 0 && !isLoading) {
    return null;
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };
  const stopSelect = (e: Event) => {
    e.preventDefault();
    // Cast to any to call stopPropagation when present (Radix onSelect passes a DOM Event)
    (e as unknown as { stopPropagation?: () => void }).stopPropagation?.();
  };

  const handleSaveOffline = async (
    sound: GeneratedSound & { isOffline?: boolean }
  ) => {
    setSavingOffline(sound.id);
    try {
      await saveOfflineAsync(sound);
      toast.success('Saved for offline access');
    } catch {
      // Failed to save offline
      toast.error('Failed to save offline');
    } finally {
      setSavingOffline(null);
    }
  };

  const handleRemoveOffline = async (
    sound: GeneratedSound & { isOffline?: boolean }
  ) => {
    setRemovingOffline(sound.id);
    try {
      await removeOfflineAsync(sound);
      toast.success('Removed from offline storage');
    } catch {
      toast.error('Failed to remove offline');
    } finally {
      setRemovingOffline(null);
    }
  };

  // Generations are already sorted by newest first
  const recentSounds = generations;

  const renderSoundCard = (sound: GeneratedSound & { isOffline?: boolean }) => {
    const isCurrentTrack = currentTrack?.id === sound.id;
    const isPlaying = playerState === 'playing' && isCurrentTrack;

    return (
      <div className="px-4 py-2">
        <ContextMenu>
          <ContextMenuTrigger>
            <button
              className="group w-full cursor-pointer rounded-xl border border-neutral-800 bg-neutral-900/50 text-left shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-neutral-700 hover:bg-neutral-800/80 hover:shadow-md"
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest('[data-no-play]')) {
                  return;
                }
                onPlaySound(sound);
              }}
              type="button"
            >
              {renderCardContent(sound, isCurrentTrack, isPlaying)}
            </button>
          </ContextMenuTrigger>
          {renderContextMenu(sound, isPlaying)}
        </ContextMenu>
      </div>
    );
  };

  const renderCardContent = (
    sound: GeneratedSound & { isOffline?: boolean },
    isCurrentTrack: boolean,
    isPlaying: boolean
  ) => (
    <div className="p-3">
      {renderCardHeader(sound, isCurrentTrack, isPlaying)}
      {renderWaveform(sound)}
      {renderMetadata(sound)}
    </div>
  );

  const renderCardHeader = (
    sound: GeneratedSound & { isOffline?: boolean },
    isCurrentTrack: boolean,
    isPlaying: boolean
  ) => (
    <div className="mb-2 flex items-start gap-3">
      {renderIcon(sound)}
      {renderTitleAndActions(sound)}
      {renderPlayButton(sound, isCurrentTrack, isPlaying)}
    </div>
  );

  const renderIcon = (sound: GeneratedSound & { isOffline?: boolean }) => (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800">
      {sound.metadata?.model?.includes('tts') ? (
        <Volume2 className="h-3.5 w-3.5 text-neutral-300" />
      ) : (
        <Music className="h-3.5 w-3.5 text-neutral-300" />
      )}
    </div>
  );

  const renderTitleAndActions = (
    sound: GeneratedSound & { isOffline?: boolean }
  ) => (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex items-start justify-between gap-2">
        <h4 className="truncate font-medium text-neutral-100 text-sm">
          {sound.title}
        </h4>
        {renderDropdownMenu(sound)}
      </div>
      <p className="line-clamp-1 text-neutral-400 text-xs leading-relaxed">
        {sound.metadata?.prompt}
      </p>
    </div>
  );

  const renderPlayButton = (
    sound: GeneratedSound & { isOffline?: boolean },
    isCurrentTrack: boolean,
    isPlaying: boolean
  ) => (
    <Button
      className={cn(
        'h-7 w-7 p-0 opacity-0 transition-all duration-200 group-hover:opacity-100',
        isCurrentTrack
          ? 'bg-neutral-700 text-neutral-100 hover:bg-neutral-600'
          : 'text-neutral-300 hover:bg-neutral-800'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onPlaySound(sound);
      }}
      size="sm"
      variant="ghost"
    >
      {isPlaying ? (
        <Pause className="h-3.5 w-3.5" />
      ) : (
        <Play className="h-3.5 w-3.5" />
      )}
    </Button>
  );

  const renderWaveform = (sound: GeneratedSound & { isOffline?: boolean }) => (
    <div className="mb-2">
      <MemoizedWaveform trackKey={sound.key} url={sound.url} />
    </div>
  );

  const renderMetadata = (sound: GeneratedSound & { isOffline?: boolean }) => (
    <div className="flex items-center justify-between text-neutral-400 text-xs">
      <div className="flex items-center gap-2">
        <div className="rounded-full border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-neutral-300 text-xs">
          {sound.metadata.model?.replace('elevenlabs-', '') === 'unknown'
            ? 'uploaded'
            : sound.metadata.model.replace('elevenlabs-', '')}
        </div>
        {sound.isOffline && (
          <div className="flex items-center gap-1 rounded-full border border-green-800/30 bg-green-900/20 px-2 py-0.5">
            <HardDrive className="h-3 w-3 text-green-500" />
            <span className="text-green-500 text-xs">Offline</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderDropdownMenu = (
    sound: GeneratedSound & { isOffline?: boolean }
  ) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="h-6 w-6 flex-shrink-0 p-0 text-neutral-300 opacity-0 transition-all duration-200 hover:bg-neutral-800 group-hover:opacity-100"
          data-no-play
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          size="sm"
          variant="ghost"
        >
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40" data-no-play>
        <DropdownMenuItem
          data-no-play
          onSelect={(e) => {
            stopSelect(e);
            handleCopyUrl(sound.url);
          }}
        >
          <Copy className="mr-2 h-3.5 w-3.5" />
          Copy URL
        </DropdownMenuItem>
        {sound.metadata?.prompt && (
          <DropdownMenuItem
            data-no-play
            onSelect={(e) => {
              stopSelect(e);
              if (sound.metadata?.prompt) {
                navigator.clipboard.writeText(sound.metadata.prompt);
                toast.success('Prompt copied to clipboard');
              }
            }}
          >
            <Copy className="mr-2 h-3.5 w-3.5" />
            Copy Prompt
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <a
            data-no-play
            download
            href={sound.url}
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="mr-2 h-3.5 w-3.5" />
            Download
          </a>
        </DropdownMenuItem>
        {!sound.isOffline && isOnline && (
          <DropdownMenuItem
            data-no-play
            disabled={savingOffline === sound.id}
            onSelect={(e) => {
              stopSelect(e);
              handleSaveOffline(sound);
            }}
          >
            {savingOffline === sound.id ? (
              <>
                <div className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <HardDrive className="mr-2 h-3.5 w-3.5" />
                Save Offline
              </>
            )}
          </DropdownMenuItem>
        )}
        {sound.isOffline && (
          <>
            <DropdownMenuItem disabled>
              <Check className="mr-2 h-3.5 w-3.5 text-green-500" />
              Saved Offline
            </DropdownMenuItem>
            <DropdownMenuItem
              data-no-play
              disabled={removingOffline === sound.id}
              onSelect={(e) => {
                stopSelect(e);
                handleRemoveOffline(sound);
              }}
            >
              {removingOffline === sound.id ? (
                <>
                  <div className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Remove Offline
                </>
              )}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderContextMenu = (
    sound: GeneratedSound & { isOffline?: boolean },
    isPlaying: boolean
  ) => (
    <ContextMenuContent className="w-40 border border-neutral-800 bg-neutral-900">
      <ContextMenuItem
        className="text-neutral-100 hover:bg-neutral-800 focus:bg-neutral-800"
        onClick={() => onPlaySound(sound)}
      >
        {isPlaying ? (
          <Pause className="mr-2 h-4 w-4" />
        ) : (
          <Play className="mr-2 h-4 w-4" />
        )}
        {isPlaying ? 'Pause' : 'Play'}
      </ContextMenuItem>
      <ContextMenuItem
        className="text-neutral-100 hover:bg-neutral-800 focus:bg-neutral-800"
        onClick={() => handleCopyUrl(sound.url)}
      >
        <Copy className="mr-2 h-4 w-4" />
        Copy URL
      </ContextMenuItem>
      {sound.metadata?.prompt && (
        <ContextMenuItem
          className="text-neutral-100 hover:bg-neutral-800 focus:bg-neutral-800"
          onClick={() => {
            if (sound.metadata?.prompt) {
              navigator.clipboard.writeText(sound.metadata.prompt);
              toast.success('Prompt copied to clipboard');
            }
          }}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy Prompt
        </ContextMenuItem>
      )}
      <ContextMenuItem asChild>
        <a
          className="text-neutral-100 hover:bg-neutral-800 focus:bg-neutral-800"
          download
          href={sound.url}
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </a>
      </ContextMenuItem>
      {!sound.isOffline && isOnline && (
        <ContextMenuItem
          className="text-neutral-100 hover:bg-neutral-800 focus:bg-neutral-800"
          disabled={savingOffline === sound.id}
          onClick={() => handleSaveOffline(sound)}
        >
          {savingOffline === sound.id ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <HardDrive className="mr-2 h-4 w-4" />
              Save Offline
            </>
          )}
        </ContextMenuItem>
      )}
      {sound.isOffline && (
        <ContextMenuItem className="text-neutral-100" disabled>
          <Check className="mr-2 h-4 w-4 text-green-500" />
          Saved Offline
        </ContextMenuItem>
      )}
    </ContextMenuContent>
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="h-8 gap-1.5 text-xs" size="sm" variant="outline">
          <History className="h-3.5 w-3.5" />
          Recent ({generations.length})
          {!isOnline && <WifiOff className="ml-1 h-3 w-3 text-orange-500" />}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-[420px] flex-col p-0" side="right">
        <SheetHeader className="border-neutral-800 border-b px-6 py-4">
          <SheetTitle className="font-semibold text-lg text-neutral-100">
            Recent Generations
          </SheetTitle>
          <p className="mt-1 text-neutral-400 text-sm">
            Your latest sound creations
          </p>
        </SheetHeader>

        {/* Storage Indicator */}
        <div className="border-neutral-800 border-b px-6 py-3">
          <StorageIndicator />
        </div>

        <div className="min-h-0 flex-1">
          <Virtuoso
            itemContent={(index) => renderSoundCard(recentSounds[index])}
            style={{ height: '100%' }}
            totalCount={recentSounds.length}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
