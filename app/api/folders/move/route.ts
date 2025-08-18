import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/auth'
import { moveFolder } from '@/lib/server/vault'
import { FolderMoveFormSchema } from '@/lib/contracts/api/folders'

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()
    const formData = await request.formData()
    const parsed = FolderMoveFormSchema.parse({
      folderId: formData.get('folderId'),
      parentFolderId: formData.get('parentFolderId'),
    })
    const parentFolderId = parsed.parentFolderId === '' ? null : parsed.parentFolderId

    await moveFolder(parsed.folderId, parentFolderId, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to move folder:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to move folder' },
      { status: 500 }
    )
  }
} 