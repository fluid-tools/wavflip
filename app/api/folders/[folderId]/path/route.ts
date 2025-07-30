import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { getVaultData } from '@/server/vault/data'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const session = await requireAuth()
    const { folderId } = await params

    if (!folderId) {
      return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 })
    }

    const data = await getVaultData(session.user.id, {
      includeHierarchy: false,
      includePath: true,
      specificFolderId: folderId
    })
    
    return NextResponse.json({ path: data.path })
  } catch (error) {
    console.error('Failed to fetch folder path:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch folder path' },
      { status: 500 }
    )
  }
} 