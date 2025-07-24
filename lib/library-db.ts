'use server'

import { db } from '@/db'
import { folder, project, track, trackVersion } from '@/db/schema/library'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import type { 
  Folder, NewFolder, 
  Project, NewProject,
  Track, NewTrack,
  TrackVersion, NewTrackVersion,
  FolderWithProjects,
  ProjectWithTracks 
} from '@/db/schema/library'

// FOLDER OPERATIONS
export async function getUserFolders(userId: string): Promise<FolderWithProjects[]> {
  const folders = await db
    .select()
    .from(folder)
    .where(eq(folder.userId, userId))
    .orderBy(folder.order, folder.createdAt)

  const foldersWithProjects = await Promise.all(
    folders.map(async (f) => {
      const projects = await db
        .select()
        .from(project)
        .where(eq(project.folderId, f.id))
        .orderBy(project.order, project.createdAt)
      
      return { ...f, projects }
    })
  )

  return foldersWithProjects
}

export async function createFolder(data: Omit<NewFolder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Folder> {
  const newFolder: NewFolder = {
    id: nanoid(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const [inserted] = await db.insert(folder).values(newFolder).returning()
  return inserted
}

export async function deleteFolder(folderId: string, userId: string): Promise<void> {
  await db
    .delete(folder)
    .where(and(eq(folder.id, folderId), eq(folder.userId, userId)))
}

// PROJECT OPERATIONS  
export async function getVaultProjects(userId: string): Promise<Project[]> {
  return await db
    .select()
    .from(project)
    .where(and(eq(project.userId, userId), isNull(project.folderId)))
    .orderBy(project.order, project.createdAt)
}

export async function getProjectWithTracks(projectId: string, userId: string): Promise<ProjectWithTracks | null> {
  const [proj] = await db
    .select()
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.userId, userId)))

  if (!proj) return null

  const tracks = await db
    .select()
    .from(track)
    .where(eq(track.projectId, projectId))
    .orderBy(track.order, track.createdAt)

  const tracksWithVersions = await Promise.all(
    tracks.map(async (t) => {
      const versions = await db
        .select()
        .from(trackVersion)
        .where(eq(trackVersion.trackId, t.id))
        .orderBy(desc(trackVersion.version))

      const activeVersion = t.activeVersionId 
        ? versions.find(v => v.id === t.activeVersionId)
        : undefined

      return { ...t, versions, activeVersion, project: proj }
    })
  )

  return { ...proj, tracks: tracksWithVersions }
}

export async function createProject(data: Omit<NewProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  const newProject: NewProject = {
    id: nanoid(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const [inserted] = await db.insert(project).values(newProject).returning()
  return inserted
}

export async function moveProject(projectId: string, folderId: string | null, userId: string): Promise<void> {
  await db
    .update(project)
    .set({ folderId, updatedAt: new Date() })
    .where(and(eq(project.id, projectId), eq(project.userId, userId)))
}

// TRACK OPERATIONS
export async function createTrack(data: Omit<NewTrack, 'id' | 'createdAt' | 'updatedAt'>): Promise<Track> {
  const newTrack: NewTrack = {
    id: nanoid(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const [inserted] = await db.insert(track).values(newTrack).returning()
  return inserted
}

export async function moveTrack(trackId: string, projectId: string, userId: string): Promise<void> {
  await db
    .update(track)
    .set({ projectId, updatedAt: new Date() })
    .where(and(eq(track.id, trackId), eq(track.userId, userId)))
}

// TRACK VERSION OPERATIONS
export async function createTrackVersion(data: Omit<NewTrackVersion, 'id' | 'version' | 'createdAt'>): Promise<TrackVersion> {
  // Get the next version number for this track
  const existingVersions = await db
    .select()
    .from(trackVersion)
    .where(eq(trackVersion.trackId, data.trackId))
    .orderBy(desc(trackVersion.version))

  const nextVersion = existingVersions.length > 0 ? existingVersions[0].version + 1 : 1

  const newVersion: NewTrackVersion = {
    id: nanoid(),
    version: nextVersion,
    ...data,
    createdAt: new Date(),
  }

  const [inserted] = await db.insert(trackVersion).values(newVersion).returning()

  // If this is the first version, set it as active
  if (nextVersion === 1) {
    await db
      .update(track)
      .set({ activeVersionId: inserted.id, updatedAt: new Date() })
      .where(eq(track.id, data.trackId))
  }

  return inserted
}

export async function setActiveVersion(trackId: string, versionId: string, userId: string): Promise<void> {
  await db
    .update(track)
    .set({ activeVersionId: versionId, updatedAt: new Date() })
    .where(and(eq(track.id, trackId), eq(track.userId, userId)))
}

// LIBRARY STATS
export async function getLibraryStats(userId: string) {
  const folders = await db
    .select()
    .from(folder)
    .where(eq(folder.userId, userId))

  const projects = await db
    .select()
    .from(project)
    .where(eq(project.userId, userId))

  const tracks = await db
    .select()
    .from(track)
    .where(eq(track.userId, userId))

  const versions = await db
    .select()
    .from(trackVersion)
    .innerJoin(track, eq(trackVersion.trackId, track.id))
    .where(eq(track.userId, userId))

  const totalSize = versions.reduce((sum, v) => sum + (v.track_version.size || 0), 0)
  const totalDuration = versions.reduce((sum, v) => sum + (v.track_version.duration || 0), 0)

  return {
    totalFolders: folders.length,
    totalProjects: projects.length,
    totalTracks: tracks.length,
    totalVersions: versions.length,
    totalSize,
    totalDuration,
  }
} 