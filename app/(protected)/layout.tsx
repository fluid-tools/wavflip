import dynamic from 'next/dynamic';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/nav/app-sidebar';
import { Navbar } from '@/components/nav/base-nav';
import PlayerDockSkeleton from '@/components/player/dock-skeleton';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { getCachedSession } from '@/lib/server/auth';
import { AppProviders } from '@/state/providers';

const PlayerDock = dynamic(() => import('@/components/player/dock'), {
  loading: () => <PlayerDockSkeleton />,
});

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check using cached session; redirect if not authenticated
  const session = await getCachedSession();
  if (!session) {
    redirect('/sign-in');
  }

  // Get sidebar state from cookie for persistence
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <AppProviders>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset className="mx-auto flex min-h-screen flex-col lg:max-w-screen-2xl">
          <header className="flex items-center gap-2 bg-background/80 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger />
            <Navbar />
          </header>
          <main className="mx-auto flex min-h-[calc(100vh-64px)] w-full flex-1 flex-col justify-center bg-background px-0 sm:px-4 xl:max-w-screen-xl 2xl:max-w-screen-2xl">
            {children}
          </main>
          <PlayerDock />
        </SidebarInset>
      </SidebarProvider>
    </AppProviders>
  );
}
