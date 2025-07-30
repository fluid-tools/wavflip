"use client"

import { usePathname } from 'next/navigation'
import Link from "next/link"
import {
  Vault,
  Music,
  Settings,
  Search,
  Mic,
  LogOut
} from "lucide-react"

import { useSession, signOut } from "@/lib/auth-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useAtom } from 'jotai'
import { currentTrackAtom } from '@/state/audio-atoms'
import { cn } from '@/lib/utils'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import SettingsDialog from "./settings-dialog"
import { VaultSidebarNavigation } from "./vault"
import { ThemeToggleGroup } from "./theme-toggle"
import Image from 'next/image'

// User dropdown content component
function UserDropdownContent({ session, handleSignOut }: { 
  session: { user: { name?: string; email?: string; image?: string | null } } | null; 
  handleSignOut: () => void 
}) {
  return (
    <DropdownMenuContent className="w-56" align="end" forceMount>
      <DropdownMenuLabel className="font-normal">
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium leading-none">{session?.user.name}</p>
          <p className="text-xs leading-none text-muted-foreground">
            {session?.user.email}
          </p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <SettingsDialog>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Settings className="mr-1 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
      </SettingsDialog>
      <DropdownMenuSeparator />
      <ThemeToggleGroup />
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleSignOut}>
        <LogOut className="mr-1 h-4 w-4" />
        <span>Sign out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}

// Main navigation items
const mainNavItems = [
  {
    title: "Studio",
    url: "/studio",
    icon: Music,
  },
  {
    title: "Vault",
    url: "/vault",
    icon: Vault,
  },
]

// Quick actions
const quickActions = [
  {
    title: "Generate Sound",
    url: "/studio",
    icon: Mic,
  },
  {
    title: "Browse Samples",
    url: "/vault",
    icon: Search,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const router = useRouter()
  const [currentTrack] = useAtom(currentTrackAtom)

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success("Signed out successfully")
      router.push("/sign-in")
    } catch {
      toast.error("Failed to sign out")
    }
  }

  const initials = session?.user.name
    ? session.user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
    : session?.user.email?.[0].toUpperCase() || "U"

  return (
    <div 
      className={cn(
        "transition-all duration-300 ease-out",
        currentTrack ? "[&_[data-slot=sidebar-container]]:!h-[calc(100vh-88px)]" : ""
      )}
    >
      <Sidebar variant="floating" collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center justify-center">
            <Image src="/logo.svg" alt="WAVFLIP" width={32} height={32} unoptimized />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">WAVFLIP</span>
            <span className="text-xs text-sidebar-foreground/60">AI Audio Sampler</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />

        {/* Vault Navigation - Shows nested folders/projects */}
        <VaultSidebarNavigation />

        <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />

        {/* Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickActions.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <SidebarMenu>
          {/* User Profile */}
          <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="group-data-[collapsible=icon]:hidden">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={session?.user.image || ""} alt={session?.user.name || ""} className="object-cover" />
                    <AvatarFallback className="text-xs flex items-center justify-center">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{session?.user.name || session?.user.email}</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <UserDropdownContent session={session} handleSignOut={handleSignOut} />
            </DropdownMenu>

            {/* User Profile - Collapsed Mode */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="hidden group-data-[collapsible=icon]:flex">
                <Button variant="outline" size="icon">
                  <Avatar className="h-[1.2rem] w-[1.2rem]">
                    <AvatarImage src={session?.user.image || ""} alt={session?.user.name || ""} className="object-cover" />
                    <AvatarFallback className="text-[0.6rem] flex items-center justify-center">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <UserDropdownContent session={session} handleSignOut={handleSignOut} />
            </DropdownMenu>
          </SidebarMenuItem>

       
         </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
    </div>
  )
}