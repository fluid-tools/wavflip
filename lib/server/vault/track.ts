import 'server-only'

import { db } from '@/db'
import { track, trackVersion } from '@/db/schema/vault'
import { TrackWithVersionsSchema, TrackCreateDataSchema, TrackVersionCreateDataSchema } from '@/lib/contracts/track'
import { and, desc, eq } from 'drizzle-orm'
import { getPresignedUrl } from '@/lib/storage/s3-storage'
import { REDIS_KEYS } from '@/lib/redis'

// Stop importing NewTrack/NewTrackVersion inferred types from DB schema; use Zod schemas instead
import { nanoid } from 'nanoid'

/**
 * Core resource fetchers (no auth)
 */
const getTrackById = async (trackId: string) => {
  const [result] = await db
    .select()
    .from(track)
    .where(eq(track.id, trackId))
    .limit(1)
  return result ?? null
}

const getActiveVersionForTrack = async (trackRecord: { activeVersionId: string | null }) => {
  if (!trackRecord.activeVersionId) return null
  const [version] = await db
    .select()
    .from(trackVersion)
    .where(eq(trackVersion.id, trackRecord.activeVersionId))
    .limit(1)
  return version ?? null
}

const isTrackOwnedByUser = (trackRecord: { userId: string }, userId: string): boolean => {
  return trackRecord.userId === userId
}

export const requireTrackOwnership = (trackRecord: { userId: string }, userId: string): void => {
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

export async function createTrack(data: ReturnType<typeof getTrackCreateInput>) {
  const now = new Date()

  // Create the track
  const base = TrackCreateDataSchema.parse(data)
  const newTrack = {
    ...base,
    id: nanoid(),
    createdAt: now,
    updatedAt: now,
  }

  const [createdTrack] = await db.insert(track).values(newTrack).returning()

  // Create initial version if file data is provided
  if (data.activeVersionId) {
    const initialVersionBase = TrackVersionCreateDataSchema.parse({
      trackId: createdTrack.id,
      fileKey: '',
      size: 0,
      duration: 0,
      mimeType: '',
      metadata: null,
    })
    await db.insert(trackVersion).values({
      ...initialVersionBase,
      id: data.activeVersionId,
      version: 1,
      createdAt: now,
    })
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

export async function createTrackVersion(data: ReturnType<typeof getTrackVersionCreateInput>) {
  // Get the next version number
  const existingVersions = await db
    .select({ version: trackVersion.version })
    .from(trackVersion)
    .where(eq(trackVersion.trackId, data.trackId))
    .orderBy(desc(trackVersion.version))
    .limit(1)

  const nextVersion = (existingVersions[0]?.version || 0) + 1

  const base = TrackVersionCreateDataSchema.parse(data)
  const newVersion = {
    ...base,
    id: nanoid(),
    version: nextVersion,
    createdAt: new Date(),
  }

  const [version] = await db.insert(trackVersion).values(newVersion).returning()
  return TrackWithVersionsSchema.shape.versions.element.parse(version)
}

export async function setActiveVersion(trackId: string, versionId: string, userId: string): Promise<void> {
  await db
    .update(track)
    .set({ activeVersionId: versionId, updatedAt: new Date() })
    .where(and(eq(track.id, trackId), eq(track.userId, userId)))
}

// Helper functions to lock types to Zod inputs (without exporting DB inferred types)
function getTrackCreateInput(input: unknown) {
  return TrackCreateDataSchema.parse(input)
}

function getTrackVersionCreateInput(input: unknown) {
  return TrackVersionCreateDataSchema.parse(input)
}


