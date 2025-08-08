import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/auth'
import { generateTrackUploadPresignedPost } from '@/lib/storage/s3-storage'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { filename, contentType, projectId } = await request.json()

    if (!filename || !contentType || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Use centralized S3 storage function (source of truth)
    const result = await generateTrackUploadPresignedPost({
      userId: session.user.id,
      projectId,
      filename,
      contentType,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to generate presigned URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}