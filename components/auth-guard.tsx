"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loading } from "@/components/loading";

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
    return <Loading />;
  }

  if (requireAuth && !session) {
    return null;
  }

  if (!requireAuth && session) {
    return null;
  }

  return <>{children}</>;
}