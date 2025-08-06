import { requireAuth } from "@/lib/server/auth";
import { AppSidebar } from "@/components/nav/app-sidebar";
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
                <AppSidebar />
                <SidebarInset className="flex flex-col max-w-screen-2xl mx-auto min-h-screen">
                    <header className="flex items-center gap-2 p-4 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <SidebarTrigger />
                        <Navbar />
                    </header>
                    <main className="flex-1 w-full max-w-screen-2xl mx-auto flex justify-center bg-background
                    md:max-w-screen-sm lg:max-w-screen-md xl:max-w-screen-lg 2xl:max-w-screen-2xl
                    px-0 sm:px-4 flex-col min-h-[calc(100vh-64px)]">
                        {children}
                    </main>
                    <PlayerDock />
                </SidebarInset>
            </SidebarProvider>
        </AppProviders>
    );
}