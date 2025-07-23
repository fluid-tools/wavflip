import { requireAuth } from "@/lib/auth-server";
import { PillsNav } from "./nav";
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
            <PillsNav />
            {children}
            <PlayerDock />
        </AppProviders>
    );
}