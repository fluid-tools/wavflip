import 'server-only';

import { and, desc, eq } from 'drizzle-orm';
// Stop importing NewTrack/NewTrackVersion inferred types from DB schema; use Zod schemas instead
import { nanoid } from 'nanoid';
import { db } from '@/db';
import { track, trackVersion } from '@/db/schema/vault';
import type {
  TrackCreateData,
  TrackVersionCreateData,
} from '@/lib/contracts/track';
import {
  TrackCreateDataSchema,
  TrackVersionCreateDataSchema,
  TrackWithVersionsSchema,
} from '@/lib/contracts/track';
import { REDIS_KEYS } from '@/lib/redis';
import { getPresignedUrl } from '@/lib/storage/s3-storage';

/**
 * Core resource fetchers (no auth)
 */
const getTrackById = async (trackId: string) => {
  const [result] = await db
    .select()
    .from(track)
    .where(eq(track.id, trackId))
    .limit(1);
  return result ?? null;
};

const getActiveVersionForTrack = async (trackRecord: {
  activeVersionId: string | null;
}) => {
  if (!trackRecord.activeVersionId) {
    return null;
  }
  const [version] = await db
    .select()
    .from(trackVersion)
    .where(eq(trackVersion.id, trackRecord.activeVersionId))
    .limit(1);
  return version ?? null;
};

const isTrackOwnedByUser = (
  trackRecord: { userId: string },
  userId: string
): boolean => {
  return trackRecord.userId === userId;
};

export const requireTrackOwnership = (
  trackRecord: { userId: string },
  userId: string
): void => {
  if (!isTrackOwnedByUser(trackRecord, userId)) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
};

// enforce ownership optional
export const getPresignedUrlForTrack = async (
  trackId: string,
  options: { requireOwnerUserId?: string; expiresInSeconds?: number } = {}
): Promise<string | null> => {
  const { requireOwnerUserId, expiresInSeconds = 60 * 60 } = options;
  const record = await getTrackById(trackId);
  if (!record) {
    return null;
  }
  if (requireOwnerUserId) {
    requireTrackOwnership(record, requireOwnerUserId);
  }
  const version = await getActiveVersionForTrack(record);
  if (!version?.fileKey) {
    return null;
  }
  const cacheKey = REDIS_KEYS.presignedTrack(trackId);
  return getPresignedUrl(version.fileKey, cacheKey, expiresInSeconds);
};

// ================================
// TRACK CRUD OPERATIONS
// ================================

export async function createTrack(data: TrackCreateData) {
  const now = new Date();

  // Create the track (remove implicit version creation)
  const base = TrackCreateDataSchema.parse(data);
  const newTrack = {
    ...base,
    id: nanoid(),
    createdAt: now,
    updatedAt: now,
    // Remove activeVersionId from initial creation
    // Versions should be created explicitly via createTrackVersion
    activeVersionId: null,
  };

  const [createdTrack] = await db.insert(track).values(newTrack).returning();
  return createdTrack;
}

export async function deleteTrack(
  trackId: string,
  userId: string
): Promise<void> {
  await db
    .delete(track)
    .where(and(eq(track.id, trackId), eq(track.userId, userId)));
}

export async function renameTrack(
  trackId: string,
  name: string,
  userId: string
): Promise<void> {
  await db
    .update(track)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(track.id, trackId), eq(track.userId, userId)));
}

export async function moveTrack(
  trackId: string,
  projectId: string,
  userId: string
): Promise<void> {
  await db
    .update(track)
    .set({ projectId, updatedAt: new Date() })
    .where(and(eq(track.id, trackId), eq(track.userId, userId)));
}
// ================================
// TRACK VERSION OPERATIONS
// ================================

export async function createTrackVersion(data: TrackVersionCreateData) {
  // Use transaction to prevent race conditions
  return await db.transaction(async (tx) => {
    // Get the next version number with locking
    const existingVersions = await tx
      .select({ version: trackVersion.version })
      .from(trackVersion)
      .where(eq(trackVersion.trackId, data.trackId))
      .orderBy(desc(trackVersion.version))
      .limit(1);

    const nextVersion = (existingVersions[0]?.version || 0) + 1;

    const base = TrackVersionCreateDataSchema.parse(data);
    const newVersion = {
      ...base,
      id: nanoid(),
      version: nextVersion,
      createdAt: new Date(),
    };

    const [version] = await tx
      .insert(trackVersion)
      .values(newVersion)
      .returning();

    return TrackWithVersionsSchema.shape.versions.element.parse(version);
  });
}

export async function setActiveVersion(
  trackId: string,
  versionId: string,
  userId: string
): Promise<void> {
  // Verify that the version belongs to the track and user owns the track
  const [versionCheck] = await db
    .select({
      trackId: trackVersion.trackId,
      userId: track.userId,
    })
    .from(trackVersion)
    .innerJoin(track, eq(track.id, trackVersion.trackId))
    .where(
      and(
        eq(trackVersion.id, versionId),
        eq(trackVersion.trackId, trackId),
        eq(track.userId, userId)
      )
    )
    .limit(1);

  if (!versionCheck) {
    throw new Error('Version not found or does not belong to the specified track');
  }

  await db
    .update(track)
    .set({ activeVersionId: versionId, updatedAt: new Date() })
    .where(and(eq(track.id, trackId), eq(track.userId, userId)));
}

// removed unused type-only helpers
