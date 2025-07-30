import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/auth'
import { moveProject } from '@/lib/server/vault'

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()
    const formData = await request.formData()
    const projectId = formData.get('projectId') as string
    const rawFolderId = formData.get('folderId') as string

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Convert empty strings to null for root placement
    const folderId = rawFolderId === '' ? null : rawFolderId

    await moveProject(projectId, folderId, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to move project:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to move project' },
      { status: 500 }
    )
  }
} 