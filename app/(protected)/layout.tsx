import { AuthGuard } from "@/components/auth-guard";
import { PillsNav } from "./nav";
import dynamic from "next/dynamic";
import PlayerDockSkeleton from "@/components/player/dock-skeleton";
import { AppProviders } from "@/state/providers";

const PlayerDock = dynamic(() => import("@/components/player/dock"), {
    loading: () => <PlayerDockSkeleton />
})


export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard requireAuth={true}>
            <AppProviders>
                <PillsNav />
                {children}
                <PlayerDock />
            </AppProviders>
        </AuthGuard>
    );
}