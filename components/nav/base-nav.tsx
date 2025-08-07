"use client"

import { usePathname } from 'next/navigation'

import { useAtom } from 'jotai'
import { currentTrackAtom, playerStateAtom, playerControlsAtom } from '@/state/audio-atoms'
import type { GeneratedSound } from '@/types/audio'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'

const VaultBreadcrumbs = dynamic(() => import("../vault/breadcrumbs").then(mod => ({ default: mod.VaultBreadcrumbs })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="h-4 bg-muted rounded animate-pulse w-12" />
    </div>
  )
})

const VaultActions = dynamic(() => import("../vault/vault-actions").then(mod => ({ default: mod.VaultActions })), {
  ssr: false
})

const RecentSheet = dynamic(() => import("../gen-ai/recent-sheet").then(mod => ({ default: mod.RecentSheet })), {
  ssr: false,
  loading: () => (
    <div className="h-8 w-16 bg-muted rounded animate-pulse" />
  )
})

export function Navbar() {
  const pathname = usePathname()
  const [currentTrack] = useAtom(currentTrackAtom)
  const [playerState] = useAtom(playerStateAtom)
  const [, dispatchPlayerAction] = useAtom(playerControlsAtom)
  const isVaultPage = pathname.includes('/vault')
  const isStudioPage = pathname.includes('/studio')

  // Extract folderId for vault actions
  const isFolder = pathname.startsWith('/vault/folders/') && pathname.split('/').length >= 4
  const folderId = isFolder ? pathname.split('/')[3] : null

  const handlePlaySound = (sound: GeneratedSound) => {
    if (currentTrack?.id === sound.id && playerState === 'playing') {
      dispatchPlayerAction({ type: 'PAUSE' })
    } else {
      dispatchPlayerAction({ type: 'PLAY_TRACK', payload: sound })
    }
  }

  const recentsButton = isStudioPage && (
    <RecentSheet
      onPlaySound={handlePlaySound}
    />
  )

  if (isVaultPage) {
    return (
      <div className="flex items-center justify-between flex-1">
        <div className="flex items-center gap-4 flex-1">
          <VaultBreadcrumbs />
        </div>
        <div className="flex items-center gap-2">
          <VaultActions folderId={folderId} />
          {recentsButton}
        </div>
      </div>
    )
  }

  if (isStudioPage) {

    return (
      <div className={cn(
        "flex items-center flex-1 justify-end",
      )}>
        {recentsButton}
      </div>
    )
  }

  return null
} 