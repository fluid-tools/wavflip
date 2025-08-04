"use client"

import { usePathname } from 'next/navigation'
import { useSidebar } from "@/components/ui/sidebar"
import { RecentSheet } from "../gen-ai/recent-sheet"
import { useAtom } from 'jotai'
import { generatedSoundsAtom } from '@/state/audio-atoms'
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

export function Navbar() {
  const pathname = usePathname()
  const { open } = useSidebar()
  const [generatedSounds] = useAtom(generatedSoundsAtom)
  const isVaultPage = pathname.includes('/vault')
  const isStudioPage = pathname.includes('/studio')

  // Extract folderId for vault actions
  const isFolder = pathname.startsWith('/vault/folders/') && pathname.split('/').length >= 4
  const folderId = isFolder ? pathname.split('/')[3] : null

  const handlePlaySound = (sound: GeneratedSound) => {
    // This will be passed to the RecentSheet - you can implement the same logic as in SoundGenerator
    console.log('Playing sound from recents:', sound)
  }

  const recentsButton = isStudioPage && generatedSounds.length > 0 && (
    <RecentSheet
      generatedSounds={generatedSounds}
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