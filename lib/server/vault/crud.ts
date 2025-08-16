import 'server-only'

import { db } from '@/db'
import { folder, project, track, trackVersion } from '@/db/schema/vault'
import { eq, and, desc, isNull, count } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import type {
  NewTrack, NewTrackVersion, Track, TrackVersion,
  FolderWithProjects} from '@/db/schema/vault'

// ================================
// DATA FETCHING OPERATIONS
// ================================

export async function getUserFolders(userId: string): Promise<FolderWithProjects[]> {
  // Only get root-level folders (parentFolderId is null)
  const folders = await db
    .select()
    .from(folder)
    .where(and(eq(folder.userId, userId), isNull(folder.parentFolderId)))
    .orderBy(folder.order, folder.createdAt)

  const foldersWithProjects = await Promise.all(
    folders.map(async (f) => {
      // Get full folder contents to calculate proper counts
      const fullFolderContent = await getFolderWithContents(f.id, userId)
      if (!fullFolderContent) {
        return {
          ...f,
          projects: [],
          subFolders: [],
          subFolderCount: 0,
          projectCount: 0
        }
      }

      return {
        ...f,
        projects: fullFolderContent.projects,
        subFolders: fullFolderContent.subFolders,
        subFolderCount: fullFolderContent.subFolderCount,
        projectCount: fullFolderContent.projectCount
      }
    })
  )

  return foldersWithProjects
}

export async function getAllUserFolders(userId: string): Promise<FolderWithProjects[]> {
  // Get ALL folders for the user (including nested ones)
  const folders = await db
    .select()
    .from(folder)
    .where(eq(folder.userId, userId))
    .orderBy(folder.order, folder.createdAt)

  const foldersWithProjects = await Promise.all(
    folders.map(async (f) => {
      const projects = await db
        .select({
          id: project.id,
          name: project.name,
          image: project.image,
          folderId: project.folderId,
          userId: project.userId,
          accessType: project.accessType,
          order: project.order,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          metadata: project.metadata,
          trackCount: count(track.id)
        })
        .from(project)
        .leftJoin(track, eq(track.projectId, project.id))
        .where(eq(project.folderId, f.id))
        .groupBy(project.id)
        .orderBy(project.order, project.createdAt)

      return {
        ...f,
        projects: projects.map(p => ({ ...p, tracks: [] })),
        subFolders: [] // Not needed for move picker
      }
    })
  )

  return foldersWithProjects
}

export async function getFolderWithContents(folderId: string, userId: string): Promise<FolderWithProjects | null> {
  const [folderData] = await db
    .select()
    .from(folder)
    .where(and(eq(folder.id, folderId), eq(folder.userId, userId)))
    .limit(1)

  if (!folderData) return null

  // Get subfolders with their full content
  const subFolders = await Promise.all(
    (await db
      .select()
      .from(folder)
      .where(and(eq(folder.parentFolderId, folderId), eq(folder.userId, userId)))
      .orderBy(folder.order, folder.createdAt))
      .map(async (sf) => {
        // Recursively get subfolder contents
        const subFolderContent = await getFolderWithContents(sf.id, userId)
        return subFolderContent || { ...sf, projects: [], subFolders: [], subFolderCount: 0, projectCount: 0 }
      })
  )

  // Get projects in this folder
  const projects = await db
    .select({
      id: project.id,
      name: project.name,
      image: project.image,
      folderId: project.folderId,
      userId: project.userId,
      accessType: project.accessType,
      order: project.order,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      metadata: project.metadata,
      trackCount: count(track.id)
    })
    .from(project)
    .leftJoin(track, eq(track.projectId, project.id))
    .where(eq(project.folderId, folderId))
    .groupBy(project.id)
    .orderBy(project.order, project.createdAt)

  // Calculate total counts including nested content
  const calculateTotalProjectCount = (folders: FolderWithProjects[]): number => {
    return folders.reduce((total, folder) => {
      return total + (folder.projects?.length || 0) + calculateTotalProjectCount(folder.subFolders || [])
    }, 0)
  }

  const directProjectCount = projects.length
  const nestedProjectCount = calculateTotalProjectCount(subFolders)
  const totalProjectCount = directProjectCount + nestedProjectCount

  return {
    ...folderData,
    subFolders,
    projects: projects.map(p => ({ ...p, tracks: [] })),
    subFolderCount: subFolders.length,
    projectCount: totalProjectCount
  }
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
      size: 0,     // Will be set by the caller  
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

