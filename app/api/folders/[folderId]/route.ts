import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { getUserFolders } from '@/lib/library-db'

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

    // Get all user folders and find the requested one
    const folders = await getUserFolders(session.user.id)
    const folder = folders.find(f => f.id === folderId)

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    return NextResponse.json(folder)
  } catch (error) {
    console.error('Failed to fetch folder:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch folder' },
      { status: 500 }
    )
  }
} 