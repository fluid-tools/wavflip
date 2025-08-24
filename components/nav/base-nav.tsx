'use client';

import { useAtom } from 'jotai';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  currentTrackAtom,
  playerControlsAtom,
  playerStateAtom,
} from '@/state/audio-atoms';
import type { GeneratedSound } from '@/types/generations';

const VaultBreadcrumbs = dynamic(
  () =>
    import('../vault/breadcrumbs').then((mod) => ({
      default: mod.VaultBreadcrumbs,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <div className="h-4 w-12 animate-pulse rounded bg-muted" />
      </div>
    ),
  }
);

const VaultActions = dynamic(
  () =>
    import('../vault/vault-actions').then((mod) => ({
      default: mod.VaultActions,
    })),
  {
    ssr: false,
  }
);

const RecentSheet = dynamic(
  () =>
    import('../gen-ai/recent-sheet').then((mod) => ({
      default: mod.RecentSheet,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <div className="h-4 w-12 animate-pulse rounded bg-muted" />
      </div>
    ),
  }
);

export function Navbar() {
  const pathname = usePathname();
  const [currentTrack] = useAtom(currentTrackAtom);
  const [playerState] = useAtom(playerStateAtom);
  const [, dispatchPlayerAction] = useAtom(playerControlsAtom);

  const MIN_PATH_SEGMENTS = 4;

  const handlePlaySound = (sound: GeneratedSound) => {
    if (currentTrack?.id === sound.id && playerState === 'playing') {
      dispatchPlayerAction({ type: 'PAUSE' });
    } else {
      dispatchPlayerAction({ type: 'PLAY_TRACK', payload: sound });
    }
  };

  switch (pathname) {
    case '/vault': {
      const isFolder =
        pathname.startsWith('/vault/folders/') &&
        pathname.split('/').length >= MIN_PATH_SEGMENTS;
      const folderId = isFolder ? pathname.split('/')[3] : null;
      return (
        <div className="flex flex-1 items-center justify-between">
          <div className="flex flex-1 items-center gap-4">
            <VaultBreadcrumbs />
          </div>
          <div className="flex items-center gap-2">
            <VaultActions folderId={folderId} />
          </div>
        </div>
      );
    }
    case '/studio':
      return (
        <div className={cn('flex flex-1 items-center justify-end')}>
          <RecentSheet onPlaySound={handlePlaySound} />
        </div>
      );
    default:
      return null;
  }
}
