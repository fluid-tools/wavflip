'use client'

import { usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfile } from "../../components/user-profile";
import Link from "next/link";
import { ThemeToggle } from "../../components/theme-toggle";

export function PillsNav() {
    const pathname = usePathname()
    const currentTab = pathname.includes('/library') ? 'library' : 'studio'
    
    return (
        <nav className="w-full flex items-center justify-between py-2 px-4 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
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
            <div className="flex items-center gap-2">
                <UserProfile />
                <ThemeToggle />
            </div>
        </nav>
    )
}
