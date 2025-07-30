import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/auth'
import { moveFolder } from '@/lib/server/vault'

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()
    const formData = await request.formData()
    const folderId = formData.get('folderId') as string
    const rawParentFolderId = formData.get('parentFolderId') as string

    if (!folderId) {
      return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 })
    }

    // Convert empty strings to null for root placement
    const parentFolderId = rawParentFolderId === '' ? null : rawParentFolderId

    await moveFolder(folderId, parentFolderId, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to move folder:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to move folder' },
      { status: 500 }
    )
  }
} 