import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/auth'
import { S3Client } from '@aws-sdk/client-s3'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { nanoid } from 'nanoid'

const s3 = new S3Client({ region: process.env.AWS_REGION })
const BUCKET = process.env.AWS_BUCKET_NAME!

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

    // Generate unique key for the track
    const trackId = nanoid()
    const extension = filename.split('.').pop() || 'mp3'
    const key = `tracks/${session.user.id}/${projectId}/${trackId}.${extension}`

    // Generate presigned POST URL for direct browser upload
    const presigned = await createPresignedPost(s3, {
      Bucket: BUCKET,
      Key: key,
      Conditions: [
        ['content-length-range', 0, 100 * 1024 * 1024], // Max 100MB
        ['starts-with', '$Content-Type', 'audio/'],
      ],
      Fields: {
        'Content-Type': contentType,
        'x-amz-meta-user-id': session.user.id,
        'x-amz-meta-project-id': projectId,
        'x-amz-meta-track-id': trackId,
      },
      Expires: 300, // 5 minutes
    })

    return NextResponse.json({
      presigned,
      trackId,
      key,
      url: `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    })
  } catch (error) {
    console.error('Failed to generate presigned URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}