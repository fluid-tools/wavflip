import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/auth'
import { getVaultData } from '@/lib/server/vault/data'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)

    const includeStats = searchParams.get('stats') === 'true'
    const excludeFolderId = searchParams.get('exclude') || undefined
    const includeLevels = searchParams.get('levels') === 'true' || !!excludeFolderId

    const vaultData = await getVaultData(session.user.id, {
      includeHierarchy: true,
      includeLevels,
      includeStats,
      excludeFolderId,
    })

    return NextResponse.json(vaultData)
  } catch (error) {
    console.error('Failed to fetch vault tree:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch vault tree' },
      { status: 500 }
    )
  }
}


