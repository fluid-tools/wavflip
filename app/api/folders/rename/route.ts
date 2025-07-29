import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { renameFolder } from '@/server/library'

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()
    const formData = await request.formData()
    const folderId = formData.get('folderId') as string
    const name = formData.get('name') as string

    if (!folderId || !name?.trim()) {
      return NextResponse.json({ error: 'Folder ID and name are required' }, { status: 400 })
    }

    await renameFolder(folderId, name, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to rename folder:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to rename folder' },
      { status: 500 }
    )
  }
} 