"use client"

import { usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useSidebar } from "@/components/ui/sidebar"
import { LibraryBreadcrumbs } from "../library/breadcrumbs"

export function Navbar() {
  const pathname = usePathname()
  const { open } = useSidebar()
  const currentTab = pathname.includes('/library') ? 'library' : 'studio'

  // Library breadcrumbs section
  if (pathname.includes('/library')) {
    return (
      <div className="flex items-center justify-between flex-1">
        <div className="flex items-center gap-4 flex-1">
          {!open && (
            <Tabs value={currentTab}>
              <TabsList className="gap-2">
                <TabsTrigger asChild value="studio">
                  <Link href="/studio">Studio</Link>
                </TabsTrigger>
                <TabsTrigger asChild value="library">
                  <Link href="/library">Library</Link>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <LibraryBreadcrumbs showActions={true} />
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
            <TabsTrigger asChild value="library">
              <Link href="/library">Library</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}
    </div>
  )
} 