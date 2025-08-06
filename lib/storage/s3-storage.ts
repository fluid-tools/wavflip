import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import type { AudioTrack } from '@/types/audio'

export interface UploadAudioOptions {
  filename?: string
  contentType?: string
  addRandomSuffix?: boolean
}

const s3 = new S3Client({ region: process.env.AWS_REGION })
const BUCKET = process.env.AWS_BUCKET_NAME!

function getExtensionFromContentType(contentType: string): string {
  const typeMap: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/mp4': 'm4a',
    'audio/webm': 'webm',
  }
  return typeMap[contentType] || 'mp3'
}

export async function uploadAudioToS3(
  audioBuffer: ArrayBuffer,
  options: UploadAudioOptions = {}
): Promise<{ url: string; pathname: string }> {
  const {
    filename = 'generated-audio',
    contentType = 'audio/mpeg',
    addRandomSuffix = true,
  } = options
  const timestamp = Date.now()
  const extension = getExtensionFromContentType(contentType)
  const finalFilename = addRandomSuffix
    ? `${filename}-${timestamp}.${extension}`
    : `${filename}.${extension}`

  // Generate presigned POST
  const presigned = await createPresignedPost({
    Bucket: BUCKET,
    Key: finalFilename,
    Conditions: [
      ['content-length-range', 0, 50 * 1024 * 1024],
      ['starts-with', '$Content-Type', 'audio/'],
    ],
    Fields: { 'Content-Type': contentType },
    Expires: 60,
  })

  // Upload file to S3 using presigned POST
  const formData = new FormData()
  Object.entries(presigned.fields).forEach(([k, v]) => formData.append(k, v))
  formData.append('file', new Blob([audioBuffer], { type: contentType }), finalFilename)
  const res = await fetch(presigned.url, { method: 'POST', body: formData })
  if (!res.ok) throw new Error('S3 upload failed')

  return {
    url: `${presigned.url}/${finalFilename}`,
    pathname: finalFilename,
  }
}

export async function deleteAudioFromS3(pathname: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: pathname }))
}

export async function listAudioFilesS3(prefix = 'generated-audio'): Promise<AudioTrack[]> {
  const { Contents } = await s3.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix })
  )
  return (
    Contents?.map((obj) => ({
      id: obj.Key!,
      title: obj.Key!.split('/').pop()!,
      url: `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${obj.Key}`,
      createdAt: obj.LastModified?.toISOString() ?? '',
      type: 'generated' as const,
      metadata: { prompt: 'Unknown', model: 's3' },
    })) ?? []
  )
}