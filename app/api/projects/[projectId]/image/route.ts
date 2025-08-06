import { NextRequest } from 'next/server'
import { db } from '@/db'
import { project } from '@/db/schema/vault'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/server/auth'
import { uploadProjectImage, getPresignedImageUrl } from '@/lib/storage/s3-storage'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await requireAuth()
    const { projectId } = await params

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

    // Use refactored S3 upload function
    const uploadResult = await uploadProjectImage(file, projectId)
    
    if (!uploadResult.success) {
      return Response.json({ success: false, error: uploadResult.error }, { status: 500 })
    }

    // Store only the S3 key (filename) in the DB
    await db
      .update(project)
      .set({ 
        image: uploadResult.filename!,
        updatedAt: new Date()
      })
      .where(eq(project.id, projectId))

    return Response.json({ 
      success: true, 
      imageUrl: uploadResult.filename // return key for client cache update
    })

  } catch (error) {
    console.error('Project image upload error:', error)
    return Response.json({ 
      success: false, 
      error: 'Failed to upload image' 
    }, { status: 500 })
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await requireAuth()
    const { projectId } = await params
    
    // Get project and check ownership
    const existingProject = await db
      .select()
      .from(project)
      .where(eq(project.id, projectId))
      .limit(1)
      
    if (!existingProject.length || existingProject[0].userId !== session.user.id) {
      return Response.json({ success: false, error: 'Project not found' }, { status: 404 })
    }
    
    const key = existingProject[0].image
    if (!key) {
      return Response.json({ success: false, error: 'No image' }, { status: 404 })
    }
    
    // Use refactored function to get presigned URL
    const signedUrl = await getPresignedImageUrl(key)
    return Response.json({ success: true, signedUrl })
  } catch (error) {
    console.error('Project image get error:', error)
    return Response.json({ success: false, error: 'Failed to get presigned URL' }, { status: 500 })
  }
}