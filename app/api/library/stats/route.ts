import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { getLibraryStats } from '@/server/library'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    
    const stats = await getLibraryStats(session.user.id)
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Failed to fetch library stats:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch library stats' },
      { status: 500 }
    )
  }
} 