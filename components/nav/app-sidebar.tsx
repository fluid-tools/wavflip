'use client';

import { useAtom } from 'jotai';
import { LogOut, Mic, Music, Search, Settings, Vault } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from '@/components/ui/sidebar';
import { signOut, useSession } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { currentTrackAtom } from '@/state/audio-atoms';
import SettingsDialog from './settings-dialog';

const VaultSidebarNavigation = dynamic(
  () =>
    import('./vault-sidebar').then((mod) => ({
      default: mod.VaultSidebarNavigation,
    })),
  {
    ssr: false,
    loading: () => (
      <SidebarGroup>
        <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
          Vault
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    ),
  }
);

import Image from 'next/image';
import { ThemeToggleGroup } from './theme-toggle';

// User dropdown content component
function UserDropdownContent({
  session,
  handleSignOut,
}: {
  session: {
    user: { name?: string; email?: string; image?: string | null };
  } | null;
  handleSignOut: () => void;
}) {
  return (
    <DropdownMenuContent align="end" className="w-56" forceMount>
      <DropdownMenuLabel className="font-normal">
        <div className="flex flex-col space-y-1">
          <p className="font-medium text-sm leading-none">
            {session?.user.name}
          </p>
          <p className="text-muted-foreground text-xs leading-none">
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
  );
}

// Main navigation items
const mainNavItems = [
  {
    title: 'Studio',
    url: '/studio',
    icon: Music,
  },
  {
    title: 'Vault',
    url: '/vault',
    icon: Vault,
  },
];

// Quick actions
const quickActions = [
  {
    title: 'Generate Sound',
    url: '/studio',
    icon: Mic,
  },
  {
    title: 'Browse Samples',
    url: '/vault',
    icon: Search,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  const [currentTrack] = useAtom(currentTrackAtom);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      router.push('/sign-in');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  const initials = session?.user.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : session?.user.email?.[0].toUpperCase() || 'U';

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        currentTrack
          ? '[&_[data-slot=sidebar-container]]:!h-[calc(100vh-88px)]'
          : ''
      )}
    >
      <Sidebar collapsible="icon" variant="floating">
        <SidebarHeader className="border-sidebar-border border-b p-4">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <div className="flex items-center justify-center">
              <Image
                alt="WAVFLIP"
                height={32}
                src="/logo.svg"
                unoptimized
                width={32}
              />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="font-semibold text-sidebar-foreground text-sm">
                WAVFLIP
              </span>
              <span className="text-sidebar-foreground/60 text-xs">
                AI Audio Sampler
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
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
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
              Quick Actions
            </SidebarGroupLabel>
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

        <SidebarFooter className="border-sidebar-border border-t p-4">
          <SidebarMenu>
            {/* User Profile */}
            <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="group-data-[collapsible=icon]:hidden">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        alt={session?.user.name || ''}
                        className="object-cover"
                        src={session?.user.image || ''}
                      />
                      <AvatarFallback className="flex items-center justify-center text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">
                      {session?.user.name || session?.user.email}
                    </span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <UserDropdownContent
                  handleSignOut={handleSignOut}
                  session={session}
                />
              </DropdownMenu>

              {/* User Profile - Collapsed Mode */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  className="hidden group-data-[collapsible=icon]:flex"
                >
                  <Button size="icon" variant="outline">
                    <Avatar className="h-[1.2rem] w-[1.2rem]">
                      <AvatarImage
                        alt={session?.user.name || ''}
                        className="object-cover"
                        src={session?.user.image || ''}
                      />
                      <AvatarFallback className="flex items-center justify-center text-[0.6rem]">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <UserDropdownContent
                  handleSignOut={handleSignOut}
                  session={session}
                />
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
