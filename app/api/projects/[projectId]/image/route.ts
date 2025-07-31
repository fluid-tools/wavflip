import { NextRequest } from 'next/server'
import { put } from '@vercel/blob'
import { db } from '@/db'
import { project } from '@/db/schema/vault'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/server/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await requireAuth()
    const { projectId } = params

    // Verify project ownership
    const existingProject = await db
      .select()
      .from(project)
      .where(eq(project.id, projectId))
      .limit(1)

    if (!existingProject.length || existingProject[0].userId !== session.user.id) {
      return Response.json({ success: false, error: 'Project not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file || !file.type.startsWith('image/')) {
      return Response.json({ success: false, error: 'Invalid image file' }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`project-${projectId}-${Date.now()}.${file.name.split('.').pop()}`, file, {
      access: 'public',
      contentType: file.type,
    })

    // Update project with new image URL
    await db
      .update(project)
      .set({ 
        image: blob.url,
        updatedAt: new Date()
      })
      .where(eq(project.id, projectId))

    return Response.json({ 
      success: true, 
      imageUrl: blob.url 
    })

  } catch (error) {
    console.error('Project image upload error:', error)
    return Response.json({ 
      success: false, 
      error: 'Failed to upload image' 
    }, { status: 500 })
  }
}