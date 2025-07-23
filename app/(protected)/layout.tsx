import { AuthGuard } from "@/components/auth-guard";
import { PillsNav } from "./nav";
import StateProviders from "@/state/providers";
import dynamic from "next/dynamic";
import PlayerDockSkeleton from "@/components/player/dock-skeleton";

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
            <StateProviders>
                <PillsNav />
                {children}
                <PlayerDock />
            </StateProviders>
        </AuthGuard>
    );
}