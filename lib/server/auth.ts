import 'server-only';

import { revalidateTag } from 'next/cache';
import { headers } from 'next/headers';
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
