import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { getVaultData } from '@/server/vault/data'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    
    // Support different query options via URL params
    const includeStats = searchParams.get('stats') === 'true'
    const excludeFolderId = searchParams.get('exclude') || undefined
    
    const vaultData = await getVaultData(session.user.id, {
      includeHierarchy: true,
      includeLevels: !!excludeFolderId, // Include levels if we're excluding (for move dialogs)
      includeStats,
      excludeFolderId
    })
    
    return NextResponse.json(vaultData)
  } catch (error) {
    console.error('Failed to fetch vault data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch vault data' },
      { status: 500 }
    )
  }
} 