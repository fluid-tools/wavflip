import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

// Centralized route groups
const API_AUTH_PREFIX = '/api/auth'
const PUBLIC_AUTH_PATHS = ['/sign-in', '/login', '/reset-password', '/login-beta']
const PROTECTED_PAGE_PREFIXES = ['/vault', '/studio'] // (protected) group pages

function isPathStartingWith(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname.startsWith(prefix))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Healthcheck
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 })
  }

  // Allow all auth API routes
  if (pathname.startsWith(API_AUTH_PREFIX)) {
    return NextResponse.next()
  }

  // Read session (presence-only)
  const sessionCookie = getSessionCookie(request)

  const isPublicAuthPage = isPathStartingWith(pathname, PUBLIC_AUTH_PATHS)
  const isProtectedPage = isPathStartingWith(pathname, PROTECTED_PAGE_PREFIXES)

  // Block protected pages when unauthenticated
  if (isProtectedPage && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (isPublicAuthPage && sessionCookie) {
    return NextResponse.redirect(new URL('/vault', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/api/:path*',
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 