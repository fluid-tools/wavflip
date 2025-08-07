import 'server-only'

import { Redis } from '@upstash/redis'

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Cache key patterns
export const REDIS_KEYS = {
  presignedImage: (projectId: string) => `presigned:image:${projectId}`,
  presignedTrack: (trackId: string) => `presigned:track:${trackId}`,
} as const

// TTL values (in seconds)
export const REDIS_TTL = {
  presignedUrl: 60 * 4, // 4 minutes (slightly less than the 5-minute presigned URL expiration)
} as const