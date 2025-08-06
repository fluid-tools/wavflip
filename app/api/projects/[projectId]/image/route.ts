import { NextRequest } from 'next/server'
import { db } from '@/db'
import { project } from '@/db/schema/vault'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/server/auth'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const BUCKET = process.env.AWS_BUCKET_NAME!
const REGION = process.env.AWS_REGION!
const s3 = new S3Client({ region: REGION })

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

    // Generate S3 presigned POST with public-read ACL
    const extension = file.type.split('/')[1] || 'png'
    const filename = `project-${projectId}-${Date.now()}.${extension}`
    const presigned = await createPresignedPost(s3, {
      Bucket: BUCKET,
      Key: filename,
      Conditions: [
        ['content-length-range', 0, 10 * 1024 * 1024],
        ['starts-with', '$Content-Type', 'image/'],
        // { acl: 'public-read' }
      ],
      Fields: { 'Content-Type': file.type, 
        // acl: 'public-read' 
      },
      Expires: 60,
    })

    // Upload file to S3 using presigned POST
    const uploadForm = new FormData()
    Object.entries(presigned.fields).forEach(([k, v]) => uploadForm.append(k, v))
    uploadForm.append('file', file, filename)
    const uploadRes = await fetch(presigned.url, { method: 'POST', body: uploadForm })
    if (!uploadRes.ok) {
      return Response.json({ success: false, error: 'Failed to upload image to S3' }, { status: 500 })
    }

    // Store only the S3 key (filename) in the DB
    await db
      .update(project)
      .set({ 
        image: filename,
        updatedAt: new Date()
      })
      .where(eq(project.id, projectId))

    return Response.json({ 
      success: true, 
      imageUrl: filename // return key for client cache update
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
  request: NextRequest,
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
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 })
    return Response.json({ success: true, signedUrl })
  } catch (error) {
    console.error('Project image get error:', error)
    return Response.json({ success: false, error: 'Failed to get presigned URL' }, { status: 500 })
  }
}