import 'server-only'

import { db } from '@/db'
import { folder, project, track, trackVersion } from '@/db/schema/library'
import { eq, and, desc, not, isNull, count } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import type { 
  Folder, NewFolder,
  Project, NewProject,
  Track, NewTrack,
  TrackVersion, NewTrackVersion,
  FolderWithProjects,
  ProjectWithTracks
} from './types'

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

export async function getVaultProjects(userId: string): Promise<ProjectWithTracks[]> {
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
    .where(and(eq(project.userId, userId), isNull(project.folderId)))
    .groupBy(project.id)
    .orderBy(project.order, project.createdAt)
  
  return projects.map(p => ({ ...p, tracks: [] }))
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

  return { ...proj, tracks: tracksWithVersions, trackCount: tracksWithVersions.length }
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
  const calculateTotalProjectCount = (folders: any[]): number => {
    return folders.reduce((total, folder) => {
      return total + (folder.projects?.length || 0) + calculateTotalProjectCount(folder.subFolders || [])
    }, 0)
  }

  const directProjectCount = projects.length
  const nestedProjectCount = calculateTotalProjectCount(subFolders)
  const totalProjectCount = directProjectCount + nestedProjectCount

  return {
    ...folderData,
    subFolders: subFolders.map(sf => ({ ...sf, projects: [], subFolders: [] })),
    projects: projects.map(p => ({ ...p, tracks: [] })),
    subFolderCount: subFolders.length,
    projectCount: totalProjectCount
  }
}

// ================================
// FOLDER CRUD OPERATIONS
// ================================

export async function createFolder(data: Omit<NewFolder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Folder> {
  const now = new Date()
  const newFolder: NewFolder = {
    ...data,
    id: nanoid(),
    createdAt: now,
    updatedAt: now
  }

  const [createdFolder] = await db.insert(folder).values(newFolder).returning()
  return createdFolder
}

export async function deleteFolder(folderId: string, userId: string): Promise<{ parentFolderId: string | null }> {
  // First, get the folder to return its parent
  const [folderToDelete] = await db
    .select()
    .from(folder)
    .where(and(eq(folder.id, folderId), eq(folder.userId, userId)))
    .limit(1)

  if (!folderToDelete) {
    throw new Error('Folder not found')
  }

  // Delete all projects in this folder (cascading delete will handle tracks)
  await db.delete(project).where(eq(project.folderId, folderId))

  // Delete all subfolders recursively
  const subfolders = await db
    .select()
    .from(folder)
    .where(and(eq(folder.parentFolderId, folderId), eq(folder.userId, userId)))

  for (const subfolder of subfolders) {
    await deleteFolder(subfolder.id, userId)
  }

  // Finally, delete the folder itself
  await db.delete(folder).where(and(eq(folder.id, folderId), eq(folder.userId, userId)))

  return { parentFolderId: folderToDelete.parentFolderId }
}

export async function renameFolder(folderId: string, name: string, userId: string): Promise<void> {
  await db
    .update(folder)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(folder.id, folderId), eq(folder.userId, userId)))
}

export async function moveFolder(folderId: string, parentFolderId: string | null, userId: string): Promise<void> {
  await db
    .update(folder)
    .set({ parentFolderId, updatedAt: new Date() })
    .where(and(eq(folder.id, folderId), eq(folder.userId, userId)))
}

// ================================
// PROJECT CRUD OPERATIONS  
// ================================

export async function createProject(data: Omit<NewProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  const now = new Date()
  const newProject: NewProject = {
    ...data,
    id: nanoid(),
    createdAt: now,
    updatedAt: now
  }

  const [createdProject] = await db.insert(project).values(newProject).returning()
  return createdProject
}

export async function deleteProject(projectId: string, userId: string): Promise<void> {
  await db.delete(project).where(and(eq(project.id, projectId), eq(project.userId, userId)))
}

export async function renameProject(projectId: string, name: string, userId: string): Promise<void> {
  await db
    .update(project)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(project.id, projectId), eq(project.userId, userId)))
}

export async function moveProject(projectId: string, folderId: string | null, userId: string): Promise<void> {
  await db
    .update(project)
    .set({ folderId, updatedAt: new Date() })
    .where(and(eq(project.id, projectId), eq(project.userId, userId)))
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
      fileUrl: '', // Will be set by the caller
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

// ================================
// UTILITY FUNCTIONS
// ================================

export async function handleDuplicateFolderName(
  name: string, 
  parentFolderId: string | null, 
  userId: string,
  excludeId?: string
): Promise<string> {
  const whereConditions = [
    eq(folder.userId, userId),
    parentFolderId ? eq(folder.parentFolderId, parentFolderId) : isNull(folder.parentFolderId)
  ]

  if (excludeId) {
    whereConditions.push(not(eq(folder.id, excludeId)))
  }

  const existingFolders = await db
    .select({ name: folder.name })
    .from(folder)
    .where(and(...whereConditions))

  const existingNames = new Set(existingFolders.map(f => f.name.toLowerCase()))

  if (!existingNames.has(name.toLowerCase())) {
    return name
  }

  let counter = 1
  let newName: string
  do {
    newName = `${name} (${counter})`
    counter++
  } while (existingNames.has(newName.toLowerCase()))

  return newName
}

export async function handleDuplicateProjectName(
  name: string,
  folderId: string | null,
  userId: string,
  excludeId?: string
): Promise<string> {
  const whereConditions = [
    eq(project.userId, userId),
    folderId ? eq(project.folderId, folderId) : isNull(project.folderId)
  ]

  if (excludeId) {
    whereConditions.push(not(eq(project.id, excludeId)))
  }

  const existingProjects = await db
    .select({ name: project.name })
    .from(project)
    .where(and(...whereConditions))

  const existingNames = new Set(existingProjects.map(p => p.name.toLowerCase()))

  if (!existingNames.has(name.toLowerCase())) {
    return name
  }

  let counter = 1
  let newName: string
  do {
    newName = `${name} (${counter})`
    counter++
  } while (existingNames.has(newName.toLowerCase()))

  return newName
} 