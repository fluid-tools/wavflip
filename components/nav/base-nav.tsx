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
    loading: () => <div className="h-8 w-16 animate-pulse rounded bg-muted" />,
  }
);

export function Navbar() {
  const pathname = usePathname();
  const [currentTrack] = useAtom(currentTrackAtom);
  const [playerState] = useAtom(playerStateAtom);
  const [, dispatchPlayerAction] = useAtom(playerControlsAtom);
  const isVaultPage = pathname.includes('/vault');
  const isStudioPage = pathname.includes('/studio');

  // Extract folderId for vault actions
  const isFolder =
    pathname.startsWith('/vault/folders/') && pathname.split('/').length >= 4;
  const folderId = isFolder ? pathname.split('/')[3] : null;

  const handlePlaySound = (sound: GeneratedSound) => {
    if (currentTrack?.id === sound.id && playerState === 'playing') {
      dispatchPlayerAction({ type: 'PAUSE' });
    } else {
      dispatchPlayerAction({ type: 'PLAY_TRACK', payload: sound });
    }
  };

  const recentsButton = isStudioPage && (
    <RecentSheet onPlaySound={handlePlaySound} />
  );

  if (isVaultPage) {
    return (
      <div className="flex flex-1 items-center justify-between">
        <div className="flex flex-1 items-center gap-4">
          <VaultBreadcrumbs />
        </div>
        <div className="flex items-center gap-2">
          <VaultActions folderId={folderId} />
          {recentsButton}
        </div>
      </div>
    );
  }

  if (isStudioPage) {
    return (
      <div className={cn('flex flex-1 items-center justify-end')}>
        {recentsButton}
      </div>
    );
  }

  return null;
}
