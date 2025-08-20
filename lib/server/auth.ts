import 'server-only';

import { revalidateTag, unstable_cache } from 'next/cache';
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

// Deterministic cookie digest for request-bounded caching (no guessing cookie names)
function hashString(input: string): string {
  let hash = 2_166_136_261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(36);
}

async function getCookieHeaderString(): Promise<string> {
  const store = await cookies();
  return store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .sort()
    .join('; ');
}

async function resolveSessionCacheKey(cookieHeader: string): Promise<string> {
  return `session:${hashString(cookieHeader)}`;
}

export async function getCachedSession() {
  const cookieHeader = await getCookieHeaderString();
  const cacheKey = await resolveSessionCacheKey(cookieHeader);
  const fetchSession = unstable_cache(
    async () => {
      try {
        const h = new Headers();
        if (cookieHeader) {
          h.set('cookie', cookieHeader);
        }
        const session = await auth.api.getSession({ headers: h });
        return session;
      } catch {
        return null;
      }
    },
    ['get-session', cacheKey],
    { tags: ['session'], revalidate: 30 }
  );
  const cached = await fetchSession();
  if (cached) {
    return cached;
  }
  // Fallback to a direct, uncached read to avoid false negatives
  return getServerSession();
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
