import 'server-only';

import { revalidateTag } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '../auth';

// Get session using better-auth's recommended approach
export async function getServerSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch {
    return null;
  }
}

async function getCookieHeaderString(): Promise<string> {
  const store = await cookies();
  return store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .sort()
    .join('; ');
}

export async function getCachedSession() {
  // Rely on Better Auth cookieCache; avoid framework-level unstable_cache.
  // We still bind the request cookies explicitly to avoid header loss in RSC.
  try {
    const h = new Headers();
    const cookieHeader = await getCookieHeaderString();
    if (cookieHeader) h.set('cookie', cookieHeader);
    const session = await auth.api.getSession({ headers: h });
    return session;
  } catch {
    return null;
  }
}

// Helper to invalidate cached session explicitly (call after auth state changes)
export async function revalidateSession() {
  revalidateTag('session');
}

// Require authentication - redirect if not authenticated // utility for api routes
export async function requireAuth() {
  const session = await getServerSession();
  if (!session) {
    redirect('/sign-in');
  }
  return session;
}
