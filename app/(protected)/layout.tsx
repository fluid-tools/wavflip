import { requireAuth } from "@/lib/server/auth";
import { SidebarWrapper } from "@/components/nav/sidebar-wrapper";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Navbar } from "@/components/nav/base-nav";
import dynamic from "next/dynamic";
import PlayerDockSkeleton from "@/components/player/dock-skeleton";
import { AppProviders } from "@/state/providers";
import { cookies } from "next/headers";

const PlayerDock = dynamic(() => import("@/components/player/dock"), {
    loading: () => <PlayerDockSkeleton />
})

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Server-side auth check - will redirect if not authenticated
    await requireAuth();

    // Get sidebar state from cookie for persistence
    const cookieStore = await cookies()
    const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

    return (
        <AppProviders>
            <SidebarProvider defaultOpen={defaultOpen}>
                <SidebarWrapper />
                <SidebarInset className="flex flex-col min-h-screen">
                    <header className="flex items-center gap-2 p-4 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <SidebarTrigger />
                        <Navbar />
                    </header>
                    <main className="flex-1 w-full">
                        {children}
                    </main>
                    <PlayerDock />
                </SidebarInset>
            </SidebarProvider>
        </AppProviders>
    );
}