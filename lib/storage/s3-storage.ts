import 'server-only';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';
import { REDIS_KEYS, REDIS_TTL, redis } from '@/lib/redis';
import type { AudioTrack } from '@/types/audio';

export interface UploadAudioOptions {
  filename?: string;
  contentType?: string;
  addRandomSuffix?: boolean;
}

export interface UploadImageOptions {
  projectId: string;
  file?: File;
  contentType?: string;
}

export interface TrackUploadConfig {
  userId: string;
  projectId: string;
  filename: string;
  contentType: string;
}

export interface GenerationUploadConfig {
  userId: string;
  filename: string;
  contentType: string;
}

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.AWS_BUCKET_NAME!;

function getExtensionFromContentType(contentType: string): string {
  const typeMap: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/mp4': 'm4a',
    'audio/webm': 'webm',
  };
  return typeMap[contentType] || 'mp3';
}

/**
 * Generate presigned POST for track upload
 * This is the source of truth for track upload logic
 */
export async function generateTrackUploadPresignedPost(
  config: TrackUploadConfig
) {
  const { userId, projectId, filename, contentType } = config;

  // Generate unique track ID and S3 key
  const trackId = nanoid();
  const extension = getExtensionFromContentType(contentType);
  const key = `tracks/${userId}/${projectId}/${trackId}.${extension}`;

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
      'x-amz-meta-user-id': userId,
      'x-amz-meta-project-id': projectId,
      'x-amz-meta-track-id': trackId,
      'x-amz-meta-filename': filename,
    },
    Expires: 300, // 5 minutes
  });

  return {
    presigned,
    trackId,
    key,
  };
}

/**
 * Generate presigned POST for generation upload
 * This is the source of truth for generation upload logic
 */
export async function generateGenerationUploadPresignedPost(
  config: GenerationUploadConfig
) {
  const { userId, filename, contentType } = config;

  const timestamp = Date.now();
  const extension = getExtensionFromContentType(contentType);
  const baseFilename = `${filename}-${timestamp}.${extension}`;
  const key = `generations/${userId}/${baseFilename}`;

  const presigned = await createPresignedPost(s3, {
    Bucket: BUCKET,
    Key: key,
    Conditions: [
      ['content-length-range', 0, 50 * 1024 * 1024], // Max 50MB
      ['starts-with', '$Content-Type', 'audio/'],
    ],
    Fields: {
      'Content-Type': contentType,
      'x-amz-meta-user-id': userId,
      'x-amz-meta-filename': filename,
    },
    Expires: 60, // 1 minute
  });

  return {
    presigned,
    key,
  };
}

export async function uploadGeneratedAudioToS3(
  audioBuffer: ArrayBuffer,
  userId: string,
  options: UploadAudioOptions = {}
): Promise<{ key: string }> {
  const { filename = 'generated-audio', contentType = 'audio/mpeg' } = options;

  // Use centralized function
  const { presigned, key } = await generateGenerationUploadPresignedPost({
    userId,
    filename,
    contentType,
  });

  // Upload file to S3 using presigned POST
  const formData = new FormData();
  Object.entries(presigned.fields).forEach(([k, v]) => formData.append(k, v));
  formData.append(
    'file',
    new Blob([audioBuffer], { type: contentType }),
    filename
  );
  const res = await fetch(presigned.url, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('S3 upload failed');

  return { key };
}

export async function deleteAudioFromS3(pathname: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: pathname }));
}

export async function listAudioFilesS3(
  prefix = 'generated-audio'
): Promise<AudioTrack[]> {
  const { Contents } = await s3.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix })
  );
  return (
    Contents?.map((obj) => ({
      id: obj.Key!,
      key: obj.Key!,
      title: obj.Key!.split('/').pop()!,
      url: `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${obj.Key}`,
      createdAt: obj.LastModified ?? new Date(),
      type: 'generated' as const,
      metadata: { prompt: 'Unknown', model: 's3' },
    })) ?? []
  );
}

export async function getPresignedUrl(
  key: string,
  cacheKey?: string,
  expiresIn = 60 * 5
): Promise<string> {
  // If cacheKey is provided, try to get from cache first
  if (cacheKey) {
    try {
      const cached = await redis.get<string>(cacheKey);

      if (cached) {
        console.log(`Cache hit for presigned URL: ${cacheKey}`);
        return cached;
      }
    } catch (error) {
      console.error('Redis cache read error:', error);
      // Continue to generate new URL if cache fails
    }
  }

  // Generate new presigned URL
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const presignedUrl = await getSignedUrl(s3, command, { expiresIn });

  // Cache the presigned URL if cacheKey is provided
  if (cacheKey) {
    try {
      await redis.set(cacheKey, presignedUrl, { ex: expiresIn - 60 }); // Cache for slightly less than expiry
      console.log(`Cached presigned URL for: ${cacheKey}`);
    } catch (error) {
      console.error('Redis cache write error:', error);
      // Continue even if caching fails
    }
  }

  return presignedUrl;
}

export async function getPresignedImageUrl(
  key: string,
  projectId?: string,
  expiresIn = 60 * 5
): Promise<string> {
  // If projectId is provided, try to get from cache first
  if (projectId) {
    try {
      const cacheKey = REDIS_KEYS.presignedImage(projectId);
      const cached = await redis.get<string>(cacheKey);

      if (cached) {
        console.log(`Cache hit for presigned URL: ${projectId}`);
        return cached;
      }
    } catch (error) {
      console.error('Redis cache read error:', error);
      // Continue to generate new URL if cache fails
    }
  }

  // Generate new presigned URL
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const presignedUrl = await getSignedUrl(s3, command, { expiresIn });

  // Cache the presigned URL if projectId is provided
  if (projectId) {
    try {
      const cacheKey = REDIS_KEYS.presignedImage(projectId);
      await redis.set(cacheKey, presignedUrl, { ex: REDIS_TTL.presignedUrl });
      console.log(`Cached presigned URL for: ${projectId}`);
    } catch (error) {
      console.error('Redis cache write error:', error);
      // Continue even if caching fails
    }
  }

  return presignedUrl;
}

export async function bustPresignedCache(cacheKey: string): Promise<void> {
  try {
    await redis.del(cacheKey);
    console.log(`Busted cache for key: ${cacheKey}`);
  } catch (error) {
    console.error('Redis cache bust error:', error);
  }
}

export async function bustPresignedImageCache(
  projectId: string
): Promise<void> {
  const cacheKey = REDIS_KEYS.presignedImage(projectId);
  return bustPresignedCache(cacheKey);
}

export async function bustPresignedTrackCache(trackId: string): Promise<void> {
  const cacheKey = REDIS_KEYS.presignedTrack(trackId);
  return bustPresignedCache(cacheKey);
}

export async function uploadProjectImage(
  file: File,
  projectId: string
): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    const extension = file.type.split('/')[1] || 'png';
    const filename = `project-${projectId}-${Date.now()}.${extension}`;

    const presigned = await createPresignedPost(s3, {
      Bucket: BUCKET,
      Key: filename,
      Conditions: [
        ['content-length-range', 0, 10 * 1024 * 1024],
        ['starts-with', '$Content-Type', 'image/'],
      ],
      Fields: { 'Content-Type': file.type },
      Expires: 60,
    });

    const uploadForm = new FormData();
    Object.entries(presigned.fields).forEach(([k, v]) =>
      uploadForm.append(k, v)
    );
    uploadForm.append('file', file, filename);

    const uploadRes = await fetch(presigned.url, {
      method: 'POST',
      body: uploadForm,
    });
    if (!uploadRes.ok) {
      return { success: false, error: 'Failed to upload image to S3' };
    }

    return { success: true, filename };
  } catch (error) {
    console.error('S3 upload error:', error);
    return { success: false, error: 'Failed to upload image' };
  }
}

/**
 * Get S3 audio stream for a given key and optional range header
 * Returns null if not found or error
 */
export async function getS3AudioStream(key: string, range?: string) {
  if (!key) return null;
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Range: range || undefined,
    });
    const s3Res = await s3.send(command);
    const { Body, ContentLength, ContentRange, ContentType, AcceptRanges } =
      s3Res;
    return { Body, ContentLength, ContentRange, ContentType, AcceptRanges };
  } catch (err: unknown) {
    const error = err as {
      $metadata?: { httpStatusCode?: number };
      name?: string;
    };
    if (error?.$metadata?.httpStatusCode === 404 || error?.name === 'NoSuchKey')
      return null;
    console.error('getS3AudioStream error:', err);
    return null;
  }
}
