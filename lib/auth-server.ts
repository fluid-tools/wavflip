'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from './auth'

// Get session using better-auth's recommended approach
export async function getServerSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    return session
  } catch {
    return null
  }
}

// Require authentication - redirect if not authenticated
export async function requireAuth() {
  const session = await getServerSession()
  if (!session) {
    redirect('/sign-in')
  }
  return session
}

// Require no authentication - redirect if authenticated
export async function requireNoAuth() {
  const session = await getServerSession()
  if (session) {
    redirect('/library')
  }
} 