import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { getLibraryData } from '@/server/vault/data'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    
    // Support different query options via URL params
    const includeStats = searchParams.get('stats') === 'true'
    const excludeFolderId = searchParams.get('exclude') || undefined
    
    const libraryData = await getLibraryData(session.user.id, {
      includeHierarchy: true,
      includeLevels: !!excludeFolderId, // Include levels if we're excluding (for move dialogs)
      includeStats,
      excludeFolderId
    })
    
    return NextResponse.json(libraryData)
  } catch (error) {
    console.error('Failed to fetch vault data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch vault data' },
      { status: 500 }
    )
  }
} 