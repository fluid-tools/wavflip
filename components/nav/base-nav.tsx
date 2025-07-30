"use client"

import { usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useSidebar } from "@/components/ui/sidebar"
import { VaultBreadcrumbs } from "../vault/breadcrumbs"

export function Navbar() {
  const pathname = usePathname()
  const { open } = useSidebar()
  const currentTab = pathname.includes('/vault') ? 'vault' : 'studio'

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
    </div>
  )
} 