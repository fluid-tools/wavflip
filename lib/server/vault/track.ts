import 'server-only'

import { db } from '@/db'
import { track, trackVersion } from '@/db/schema/vault'
import { and, eq } from 'drizzle-orm'
import { getPresignedUrl } from '@/lib/storage/s3-storage'
import { REDIS_KEYS } from '@/lib/redis'

import type { Track, TrackVersion } from '@/db/schema/vault'

/**
 * Core resource fetchers (no auth)
 */
const getTrackById = async (trackId: string): Promise<Track | null> => {
  const [result] = await db
    .select()
    .from(track)
    .where(eq(track.id, trackId))
    .limit(1)
  return result ?? null
}

const getActiveVersionForTrack = async (trackRecord: Track): Promise<TrackVersion | null> => {
  if (!trackRecord.activeVersionId) return null
  const [version] = await db
    .select()
    .from(trackVersion)
    .where(eq(trackVersion.id, trackRecord.activeVersionId))
    .limit(1)
  return version ?? null
}

const isTrackOwnedByUser = (trackRecord: Track, userId: string): boolean => {
  return trackRecord.userId === userId
}

export const requireTrackOwnership = (trackRecord: Track, userId: string): void => {
  if (!isTrackOwnedByUser(trackRecord, userId)) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }
}

// enforce ownership optional
export const getPresignedUrlForTrack = async (
  trackId: string,
  options: { requireOwnerUserId?: string; expiresInSeconds?: number } = {}
): Promise<string | null> => {
  const { requireOwnerUserId, expiresInSeconds = 60 * 60 } = options
  const record = await getTrackById(trackId)
  if (!record) return null
  if (requireOwnerUserId) requireTrackOwnership(record, requireOwnerUserId)
  const version = await getActiveVersionForTrack(record)
  if (!version || !version.fileKey) return null
  const cacheKey = REDIS_KEYS.presignedTrack(trackId)
  return getPresignedUrl(version.fileKey, cacheKey, expiresInSeconds)
}


