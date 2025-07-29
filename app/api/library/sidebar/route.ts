import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { getSidebarData } from '@/server/library'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const sidebarData = await getSidebarData(session.user.id)
    return NextResponse.json(sidebarData)
  } catch (error) {
    console.error('Failed to fetch sidebar library data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch library data' },
      { status: 500 }
    )
  }
} 