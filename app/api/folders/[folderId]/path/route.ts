import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { db } from '@/db'
import { folder, type Folder } from '@/db/schema/library'
import { eq, and } from 'drizzle-orm'

interface FolderPathItem {
  id: string
  name: string
  parentFolderId: string | null
}

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

    // Build the path from current folder to root
    const path: FolderPathItem[] = []
    let currentFolderId: string | null = folderId

    while (currentFolderId) {
      const folderData: Folder[] = await db
        .select()
        .from(folder)
        .where(and(eq(folder.id, currentFolderId), eq(folder.userId, session.user.id)))
        .limit(1)

      if (folderData.length === 0) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
      }

      const currentFolder: Folder = folderData[0]
      path.unshift({
        id: currentFolder.id,
        name: currentFolder.name,
        parentFolderId: currentFolder.parentFolderId
      })

      currentFolderId = currentFolder.parentFolderId
    }

    return NextResponse.json({ path })
  } catch (error) {
    console.error('Failed to fetch folder path:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch folder path' },
      { status: 500 }
    )
  }
} 