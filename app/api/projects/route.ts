import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/auth'
import { 
  createProject, 
  deleteProject,
  handleDuplicateProjectName 
} from '@/lib/server/vault'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const formData = await request.formData()
    const name = formData.get('name') as string
    const folderId = formData.get('folderId') as string | null

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    // Handle duplicate names by adding suffix
    const projectName = await handleDuplicateProjectName(
      name,
      folderId || null,
      session.user.id
    )

    const project = await createProject({
      name: projectName,
      folderId: folderId || null,
      userId: session.user.id,
      accessType: 'private',
      order: 0,
    })

    return NextResponse.json({ success: true, project })
  } catch (error) {
    console.error('Failed to create project:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create project' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth()
    const formData = await request.formData()
    const projectId = formData.get('projectId') as string

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    await deleteProject(projectId, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete project:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete project' },
      { status: 500 }
    )
  }
} 