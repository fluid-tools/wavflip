"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending) {
      if (requireAuth && !session) {
        router.push("/sign-in");
      } else if (!requireAuth && session) {
        router.push("/library");
      }
    }
  }, [session, isPending, requireAuth, router]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse">
          {/* Nav skeleton */}
          <div className="w-full flex items-center justify-between py-2 px-4 border-b bg-background/80 backdrop-blur">
            <div className="flex gap-2">
              <div className="h-10 w-20 bg-muted rounded-md" />
              <div className="h-10 w-20 bg-muted rounded-md" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-muted rounded-full" />
              <div className="h-8 w-8 bg-muted rounded" />
            </div>
          </div>
          
          {/* Page content skeleton */}
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <div className="h-8 w-64 bg-muted rounded mx-auto mb-2" />
                <div className="h-4 w-80 bg-muted rounded mx-auto" />
              </div>
              <div className="space-y-4">
                <div className="h-40 bg-muted rounded-lg" />
                <div className="h-20 bg-muted rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // if ((requireAuth && !session) || (!requireAuth && session)) {
  //   return null;
  // }

  return <>{children}</>;
}