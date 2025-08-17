import 'server-only'

import { db } from '@/db'
import { track, trackVersion } from '@/db/schema/vault'
import { and, desc, eq } from 'drizzle-orm'
import { getPresignedUrl } from '@/lib/storage/s3-storage'
import { REDIS_KEYS } from '@/lib/redis'

import type { NewTrack, NewTrackVersion, Track, TrackVersion } from '@/db/schema/vault'
import { nanoid } from 'nanoid'

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


// ================================
// TRACK CRUD OPERATIONS
// ================================

export async function createTrack(data: Omit<NewTrack, 'id' | 'createdAt' | 'updatedAt'>): Promise<Track> {
  const now = new Date()

  // Create the track
  const newTrack: NewTrack = {
    ...data,
    id: nanoid(),
    createdAt: now,
    updatedAt: now
  }

  const [createdTrack] = await db.insert(track).values(newTrack).returning()

  // Create initial version if file data is provided
  if (data.activeVersionId) {
    const initialVersion: NewTrackVersion = {
      id: data.activeVersionId,
      trackId: createdTrack.id,
      version: 1,
      fileKey: '', // Will be set by the caller
      size: 0, // Will be set by the caller  
      duration: 0, // Will be set by the caller
      mimeType: '', // Will be set by the caller
      createdAt: now,
      metadata: null
    }

    await db.insert(trackVersion).values(initialVersion)
  }

  return createdTrack
}

export async function deleteTrack(trackId: string, userId: string): Promise<void> {
  await db.delete(track).where(and(eq(track.id, trackId), eq(track.userId, userId)))
}

export async function renameTrack(trackId: string, name: string, userId: string): Promise<void> {
  await db
    .update(track)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(track.id, trackId), eq(track.userId, userId)))
}

export async function moveTrack(trackId: string, projectId: string, userId: string): Promise<void> {
  await db
    .update(track)
    .set({ projectId, updatedAt: new Date() })
    .where(and(eq(track.id, trackId), eq(track.userId, userId)))
}
// ================================
// TRACK VERSION OPERATIONS
// ================================

export async function createTrackVersion(data: Omit<NewTrackVersion, 'id' | 'version' | 'createdAt'>): Promise<TrackVersion> {
  // Get the next version number
  const existingVersions = await db
    .select({ version: trackVersion.version })
    .from(trackVersion)
    .where(eq(trackVersion.trackId, data.trackId))
    .orderBy(desc(trackVersion.version))
    .limit(1)

  const nextVersion = (existingVersions[0]?.version || 0) + 1

  const newVersion: NewTrackVersion = {
    ...data,
    id: nanoid(),
    version: nextVersion,
    createdAt: new Date()
  }

  const [version] = await db.insert(trackVersion).values(newVersion).returning()
  return version
}

export async function setActiveVersion(trackId: string, versionId: string, userId: string): Promise<void> {
  await db
    .update(track)
    .set({ activeVersionId: versionId, updatedAt: new Date() })
    .where(and(eq(track.id, trackId), eq(track.userId, userId)))
}


