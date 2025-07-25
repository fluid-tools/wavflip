'use server'

import { db } from '@/db'
import { folder, project, track, trackVersion } from '@/db/schema/library'
import { eq, and, isNull, desc, count } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import type { 
  Folder, NewFolder, 
  Project, NewProject,
  Track, NewTrack,
  TrackVersion, NewTrackVersion,
  FolderWithProjects,
  ProjectWithTracks,
  ProjectWithTrackCount
} from '@/db/schema/library'

// FOLDER OPERATIONS
export async function getUserFolders(userId: string): Promise<FolderWithProjects[]> {
  // Only get root-level folders (parentFolderId is null)
  const folders = await db
    .select()
    .from(folder)
    .where(and(eq(folder.userId, userId), isNull(folder.parentFolderId)))
    .orderBy(folder.order, folder.createdAt)

  const foldersWithProjects = await Promise.all(
    folders.map(async (f) => {
      const [projects, subFolderCount] = await Promise.all([
        db
          .select({
            id: project.id,
            name: project.name,
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
          .orderBy(project.order, project.createdAt),
        db.select({ count: count() }).from(folder)
          .where(and(eq(folder.parentFolderId, f.id), eq(folder.userId, userId)))
      ])
      
      return { 
        ...f, 
        projects,
        subFolderCount: subFolderCount[0]?.count || 0,
        projectCount: projects.length
      }
    })
  )

  return foldersWithProjects
}

export async function getFolderWithContents(folderId: string, userId: string): Promise<FolderWithProjects | null> {
  // Get the specific folder
  const folderData = await db
    .select()
    .from(folder)
    .where(and(eq(folder.id, folderId), eq(folder.userId, userId)))
    .limit(1)

  if (folderData.length === 0) {
    return null
  }

  const currentFolder = folderData[0]

  // Get subfolders with their subfolder and project counts
  const subFoldersData = await db
    .select()
    .from(folder)
    .where(and(eq(folder.parentFolderId, folderId), eq(folder.userId, userId)))
    .orderBy(folder.order, folder.createdAt)

  // For each subfolder, get the count of its contents
  const subFoldersWithCounts = await Promise.all(
    subFoldersData.map(async (subFolder) => {
      const [subFolderCount, projectCount] = await Promise.all([
        db.select({ count: count() }).from(folder)
          .where(and(eq(folder.parentFolderId, subFolder.id), eq(folder.userId, userId))),
        db.select({ count: count() }).from(project)
          .where(eq(project.folderId, subFolder.id))
      ])
      
      return {
        ...subFolder,
        projects: [],
        subFolderCount: subFolderCount[0]?.count || 0,
        projectCount: projectCount[0]?.count || 0
      }
    })
  )

  // Get projects in this folder
  const projects = await db
    .select({
      id: project.id,
      name: project.name,
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
  
  return { 
    ...currentFolder, 
    projects,
    subFolders: subFoldersWithCounts 
  }
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

export async function deleteFolder(folderId: string, userId: string): Promise<{ parentFolderId: string | null }> {
  // First get the folder to know its parent for revalidation
  const folderData = await db
    .select({ parentFolderId: folder.parentFolderId })
    .from(folder)
    .where(and(eq(folder.id, folderId), eq(folder.userId, userId)))
    .limit(1)

  if (folderData.length === 0) {
    throw new Error('Folder not found')
  }

  const parentFolderId = folderData[0].parentFolderId

  // Recursively delete all subfolders and their contents
  const deleteNestedFolders = async (currentFolderId: string) => {
    // Get all subfolders
    const subFolders = await db
      .select()
      .from(folder)
      .where(and(eq(folder.parentFolderId, currentFolderId), eq(folder.userId, userId)))

    // Recursively delete each subfolder
    for (const subFolder of subFolders) {
      await deleteNestedFolders(subFolder.id)
    }

    // Delete the current folder (this will cascade delete projects, tracks, and versions via DB constraints)
    await db
      .delete(folder)
      .where(and(eq(folder.id, currentFolderId), eq(folder.userId, userId)))
  }

  // Start the recursive deletion from the target folder
  await deleteNestedFolders(folderId)

  return { parentFolderId }
}

export async function renameFolder(folderId: string, name: string, userId: string): Promise<void> {
  await db
    .update(folder)
    .set({ 
      name: name.trim(), 
      updatedAt: new Date() 
    })
    .where(and(eq(folder.id, folderId), eq(folder.userId, userId)))
}

// PROJECT OPERATIONS  
export async function getVaultProjects(userId: string): Promise<ProjectWithTrackCount[]> {
  return await db
    .select({
      id: project.id,
      name: project.name,
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
    .where(and(eq(project.userId, userId), isNull(project.folderId)))
    .groupBy(project.id)
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

export async function deleteProject(projectId: string, userId: string): Promise<void> {
  await db
    .delete(project)
    .where(and(eq(project.id, projectId), eq(project.userId, userId)))
}

export async function renameProject(projectId: string, name: string, userId: string): Promise<void> {
  await db
    .update(project)
    .set({ 
      name: name.trim(), 
      updatedAt: new Date() 
    })
    .where(and(eq(project.id, projectId), eq(project.userId, userId)))
}

export async function moveFolder(folderId: string, parentFolderId: string | null, userId: string): Promise<void> {
  await db
    .update(folder)
    .set({ parentFolderId, updatedAt: new Date() })
    .where(and(eq(folder.id, folderId), eq(folder.userId, userId)))
}

export async function moveProject(projectId: string, folderId: string | null, userId: string): Promise<void> {
  await db
    .update(project)
    .set({ folderId, updatedAt: new Date() })
    .where(and(eq(project.id, projectId), eq(project.userId, userId)))
}

// TRACK OPERATIONS
export async function createTrack(data: Omit<NewTrack, 'id' | 'createdAt' | 'updatedAt'>): Promise<Track> {
  let trackName = data.name.trim()
  
  // Check for existing tracks with the same name in the project
  const existingTracks = await db
    .select({ name: track.name })
    .from(track)
    .where(and(eq(track.projectId, data.projectId), eq(track.userId, data.userId)))
  
  const existingNames = new Set(existingTracks.map(t => t.name))
  
  // If name exists, add incrementing suffix
  if (existingNames.has(trackName)) {
    let counter = 1
    let newName = `${trackName} (${counter})`
    
    while (existingNames.has(newName)) {
      counter++
      newName = `${trackName} (${counter})`
    }
    
    trackName = newName
  }

  const newTrack: NewTrack = {
    id: nanoid(),
    ...data,
    name: trackName,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const [inserted] = await db.insert(track).values(newTrack).returning()
  return inserted
}

export async function deleteTrack(trackId: string, userId: string): Promise<void> {
  await db
    .delete(track)
    .where(and(eq(track.id, trackId), eq(track.userId, userId)))
}

export async function renameTrack(trackId: string, name: string, userId: string): Promise<void> {
  await db
    .update(track)
    .set({ 
      name: name.trim(), 
      updatedAt: new Date() 
    })
    .where(and(eq(track.id, trackId), eq(track.userId, userId)))
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