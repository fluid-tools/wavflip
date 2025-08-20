import 'server-only';

import { revalidateTag, unstable_cache } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { auth } from '../auth';
import { logger } from '../logger';

// Get session using better-auth's recommended approach
export async function getServerSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch (error) {
    logger.auth('Failed to get server session', undefined, { error: error as Error });
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
      } catch (error) {
        logger.auth('Failed to get cached session', undefined, { error: error as Error });
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

/**
 * Require authentication for pages - redirects to sign-in if not authenticated
 * Use this in page components and layout files
 */
export async function requireAuthPage() {
  const session = await getServerSession();
  if (!session) {
    logger.auth('Unauthorized page access, redirecting to sign-in');
    redirect('/sign-in');
  }
  logger.auth('Page access authorized', session.user.id);
  return session;
}

/**
 * Require authentication for API routes - returns standardized 401 JSON response if not authenticated
 * Use this in API route handlers
 */
export async function requireAuthApi() {
  const session = await getServerSession();
  if (!session) {
    logger.auth('Unauthorized API access');
    return {
      error: true,
      response: NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      ),
    };
  }
  
  logger.auth('API access authorized', session.user.id);
  return {
    error: false,
    session,
  };
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use requireAuthPage() or requireAuthApi() instead
 */
export const requireAuth = requireAuthPage;
