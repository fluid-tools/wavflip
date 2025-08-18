import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/auth'
import { moveProject } from '@/lib/server/vault'
import { z } from 'zod'

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()
    const formData = await request.formData()
    const Schema = z.object({
      projectId: z.string().min(1),
      folderId: z.union([z.string().min(1), z.literal('')]).optional(),
    })
    const parsed = Schema.parse({
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