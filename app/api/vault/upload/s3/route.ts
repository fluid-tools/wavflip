import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/auth'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { S3Client } from '@aws-sdk/client-s3'

const BUCKET = process.env.AWS_BUCKET_NAME!
const REGION = process.env.AWS_REGION!
const s3 = new S3Client({ region: REGION })

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const { filename = 'generated-audio', contentType = 'audio/mpeg', addRandomSuffix = true } = await request.json()
    if (!contentType.startsWith('audio/')) {
      return NextResponse.json({ error: 'Only audio files allowed' }, { status: 400 })
    }
    const timestamp = Date.now()
    const extension = contentType.split('/')[1] || 'mp3'
    const finalFilename = addRandomSuffix
      ? `${filename}-${timestamp}.${extension}`
      : `${filename}.${extension}`
    const presigned = await createPresignedPost(s3, {
      Bucket: BUCKET,
      Key: finalFilename,
      Conditions: [
        ['content-length-range', 0, 50 * 1024 * 1024],
        ['starts-with', '$Content-Type', 'audio/'],
      ],
      Fields: { 'Content-Type': contentType },
      Expires: 60,
    })
    return NextResponse.json({ ...presigned, finalFilename })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'S3 upload error' }, { status: 400 })
  }
}