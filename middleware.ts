import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Use better-auth's helper to check for session cookie (not validate it)
  const sessionCookie = getSessionCookie(request)
  
  // Protected routes - require authentication
  const protectedRoutes = ['/library', '/studio']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // Auth routes - redirect if already has session
  const authRoutes = ['/sign-in', '/login']
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }
  
  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL('/library', request.url))
  }
  
  // Keep landing page (/) accessible for everyone
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 