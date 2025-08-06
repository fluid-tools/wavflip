import 'server-only'

import { S3Client, DeleteObjectCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { AudioTrack } from '@/types/audio'

export interface UploadAudioOptions {
  filename?: string
  contentType?: string
  addRandomSuffix?: boolean
}

export interface UploadImageOptions {
  projectId: string
  file?: File
  contentType?: string
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
      createdAt: obj.LastModified ?? new Date(),
      type: 'generated' as const,
      metadata: { prompt: 'Unknown', model: 's3' },
    })) ?? []
  )
}

export async function getPresignedImageUrl(key: string, expiresIn = 60 * 5): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  return getSignedUrl(s3, command, { expiresIn })
}

export async function uploadProjectImage(
  file: File,
  projectId: string
): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    const extension = file.type.split('/')[1] || 'png'
    const filename = `project-${projectId}-${Date.now()}.${extension}`
    
    const presigned = await createPresignedPost(s3, {
      Bucket: BUCKET,
      Key: filename,
      Conditions: [
        ['content-length-range', 0, 10 * 1024 * 1024],
        ['starts-with', '$Content-Type', 'image/'],
      ],
      Fields: { 'Content-Type': file.type },
      Expires: 60,
    })

    const uploadForm = new FormData()
    Object.entries(presigned.fields).forEach(([k, v]) => uploadForm.append(k, v))
    uploadForm.append('file', file, filename)
    
    const uploadRes = await fetch(presigned.url, { method: 'POST', body: uploadForm })
    if (!uploadRes.ok) {
      return { success: false, error: 'Failed to upload image to S3' }
    }

    return { success: true, filename }
  } catch (error) {
    console.error('S3 upload error:', error)
    return { success: false, error: 'Failed to upload image' }
  }
}