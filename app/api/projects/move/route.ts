import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/auth'
import { moveProject } from '@/lib/server/vault'
import { ProjectMoveFormSchema } from '@/lib/contracts/api/projects'

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()
    const formData = await request.formData()
    const parsed = ProjectMoveFormSchema.parse({
      projectId: formData.get('projectId'),
      folderId: formData.get('folderId'),
    })
    const folderId = parsed.folderId === '' ? null : parsed.folderId ?? null

    await moveProject(parsed.projectId, folderId, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to move project:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to move project' },
      { status: 500 }
    )
  }
} 