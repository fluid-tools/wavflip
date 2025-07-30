import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/auth'
import { renameProject } from '@/lib/server/vault'

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()
    const formData = await request.formData()
    const projectId = formData.get('projectId') as string
    const name = formData.get('name') as string

    if (!projectId || !name?.trim()) {
      return NextResponse.json({ error: 'Project ID and name are required' }, { status: 400 })
    }

    await renameProject(projectId, name, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to rename project:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to rename project' },
      { status: 500 }
    )
  }
} 