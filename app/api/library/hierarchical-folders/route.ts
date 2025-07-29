import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { getHierarchicalFolders } from '@/server/library'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const excludeFolderId = searchParams.get('exclude') || undefined
    
    const hierarchicalFolders = await getHierarchicalFolders(session.user.id, excludeFolderId)
    return NextResponse.json({ folders: hierarchicalFolders })
  } catch (error) {
    console.error('Failed to fetch hierarchical folders:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch folders' },
      { status: 500 }
    )
  }
} 