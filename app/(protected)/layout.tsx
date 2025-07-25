import { requireAuth } from "@/lib/auth-server";
import { Nav } from "@/components/navbar";
import dynamic from "next/dynamic";
import PlayerDockSkeleton from "@/components/player/dock-skeleton";
import { AppProviders } from "@/state/providers";

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

    return (
        
        <AppProviders>
            <Nav />
            {children}
            <PlayerDock />
        </AppProviders>
    );
}