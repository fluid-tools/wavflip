"use client"

import { usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useSidebar } from "@/components/ui/sidebar"
import { VaultBreadcrumbs } from "../vault/breadcrumbs"
import { RecentSheet } from "../gen-ai/recent-sheet"
import { useAtom } from 'jotai'
import { generatedSoundsAtom } from '@/state/audio-atoms'
import type { GeneratedSound } from '@/types/audio'

export function Navbar() {
  const pathname = usePathname()
  const { open } = useSidebar()
  const [generatedSounds] = useAtom(generatedSoundsAtom)
  const currentTab = pathname.includes('/vault') ? 'vault' : 'studio'

  const handlePlaySound = (sound: GeneratedSound) => {
    // This will be passed to the RecentSheet - you can implement the same logic as in SoundGenerator
    console.log('Playing sound from recents:', sound)
  }

  // Vault breadcrumbs section
  if (pathname.includes('/vault')) {
    return (
      <div className="flex items-center justify-between flex-1">
        <div className="flex items-center gap-4 flex-1">
          {!open && (
            <Tabs value={currentTab}>
              <TabsList className="gap-2">
                <TabsTrigger asChild value="studio">
                  <Link href="/studio">Studio</Link>
                </TabsTrigger>
                <TabsTrigger asChild value="vault">
                  <Link href="/vault">Vault</Link>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <VaultBreadcrumbs showActions={true} />
        </div>
      </div>
    )
  }

  // Default navbar for studio and other pages
  return (
    <div className="flex items-center justify-between flex-1">
      {!open && (
        <Tabs value={currentTab} className="flex-1">
          <TabsList className="gap-2">
            <TabsTrigger asChild value="studio">
              <Link href="/studio">Studio</Link>
            </TabsTrigger>
            <TabsTrigger asChild value="vault">
              <Link href="/vault">Vault</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      {/* Show recents button on studio page */}
      {pathname.includes('/studio') && generatedSounds.length > 0 && (
        <RecentSheet 
          generatedSounds={generatedSounds} 
          onPlaySound={handlePlaySound} 
        />
      )}
    </div>
  )
} 