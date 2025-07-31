"use client"

import { usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
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

export function Navbar() {
  const pathname = usePathname()
  const { open } = useSidebar()
  const [generatedSounds] = useAtom(generatedSoundsAtom)
  const currentTab = pathname.includes('/vault') ? 'vault' : 'studio'
  const isVaultPage = pathname.includes('/vault')
  const isStudioPage = pathname.includes('/studio')

  const handlePlaySound = (sound: GeneratedSound) => {
    // This will be passed to the RecentSheet - you can implement the same logic as in SoundGenerator
    console.log('Playing sound from recents:', sound)
  }

  const navigationTabs = !open && (
    <Tabs value={currentTab} className={isVaultPage ? undefined : "flex-1"}>
      <TabsList className="gap-2">
        <TabsTrigger asChild value="studio">
          <Link href="/studio">Studio</Link>
        </TabsTrigger>
        <TabsTrigger asChild value="vault">
          <Link href="/vault">Vault</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )

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
          {navigationTabs}
          <VaultBreadcrumbs showActions={true} />
        </div>
        {recentsButton}
      </div>
    )
  }

  return (
    <div className={cn(
      "flex items-center flex-1",
      !open ? "justify-between" : "justify-end"
    )}>
      {navigationTabs}
      {recentsButton}
    </div>
  )
} 