import 'server-only'

import { db } from '@/db'
import { folder, project, track, trackVersion } from '@/db/schema/vault'
import { eq, and, isNull, count, not } from 'drizzle-orm'
import type { 
  VaultData, 
  VaultFolder, 
  BreadcrumbItem, 
  VaultStats,
  VaultQueryOptions,
  Folder,
} from './types'

// ================================
// CORE DATA FETCHING
// ================================

export async function getVaultData(userId: string, options: VaultQueryOptions = {}): Promise<VaultData> {
  const {
    includeStats = false,
    includePath = false,
    includeHierarchy = true,
    excludeFolderId,
    specificFolderId,
    includeLevels = false
  } = options

  // Build folder query with exclusions
  const whereConditions = [eq(folder.userId, userId)]
  if (excludeFolderId) {
    whereConditions.push(not(eq(folder.id, excludeFolderId)))
  }
  
  const allFolders = await db
    .select()
    .from(folder)
    .where(and(...whereConditions))
    .orderBy(folder.order, folder.createdAt)

  // Get all projects with track counts for each folder
  const folderProjects = await Promise.all(
    allFolders.map(async (f) => {
      const projects = await db
        .select({
          id: project.id,
          name: project.name,
          image: project.image,
          folderId: project.folderId,
          accessType: project.accessType,
          userId: project.userId,
          order: project.order,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          trackCount: count(track.id)
        })
        .from(project)
        .leftJoin(track, eq(track.projectId, project.id))
        .where(eq(project.folderId, f.id))
        .groupBy(project.id)
        .orderBy(project.order, project.createdAt)
      
      return { folderId: f.id, projects }
    })
  )

  const projectsByFolder = new Map(
    folderProjects.map(fp => [fp.folderId, fp.projects])
  )

  // Calculate total project count including nested projects
  const calculateTotalProjectCount = (folders: VaultFolder[]): number => {
    return folders.reduce((total, folder) => {
      return total + folder.projects.length + calculateTotalProjectCount(folder.subfolders)
    }, 0)
  }

  // Build hierarchical structure
  const buildHierarchy = (parentId: string | null = null, level = 0): VaultFolder[] => {
    return allFolders
      .filter(f => f.parentFolderId === parentId)
      .map(f => {
        const projects = projectsByFolder.get(f.id) || []
        const subfolders = includeHierarchy ? buildHierarchy(f.id, level + 1) : []

        const folder: VaultFolder = {
          id: f.id,
          name: f.name,
          parentFolderId: f.parentFolderId,
          projects,
          subfolders,
          projectCount: projects.length + calculateTotalProjectCount(subfolders),
          subFolderCount: subfolders.length
        }

        if (includeLevels) {
          folder.level = level
        }

        return folder
      })
  }

  // Get root projects (not in any folder)
  const rootProjects = await db
    .select({
      id: project.id,
      name: project.name,
      image: project.image,
      folderId: project.folderId,
      accessType: project.accessType,
      userId: project.userId,
      order: project.order,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      trackCount: count(track.id)
    })
    .from(project)
    .leftJoin(track, eq(track.projectId, project.id))
    .where(and(eq(project.userId, userId), isNull(project.folderId)))
    .groupBy(project.id)
    .orderBy(project.order, project.createdAt)

  const result: VaultData = {
    folders: buildHierarchy(),
    rootProjects
  }

  // Add path if requested
  if (includePath && specificFolderId) {
    result.path = await getFolderPath(specificFolderId, userId)
  }

  // Add stats if requested
  if (includeStats) {
    result.stats = await getVaultStats(userId)
  }

  return result
}

// ================================
// SPECIFIC DATA HELPERS
// ================================

async function getFolderPath(folderId: string, userId: string): Promise<BreadcrumbItem[]> {
  const path: BreadcrumbItem[] = []
  let currentFolderId: string | null = folderId

  while (currentFolderId) {
    const folderData: Folder[] = await db
      .select()
      .from(folder)
      .where(and(eq(folder.id, currentFolderId), eq(folder.userId, userId)))
      .limit(1)

    if (folderData.length === 0) {
      throw new Error('Folder not found')
    }

    const currentFolder: Folder = folderData[0]
    path.unshift({
      id: currentFolder.id,
      name: currentFolder.name,
      parentFolderId: currentFolder.parentFolderId
    })

    currentFolderId = currentFolder.parentFolderId
  }

  return path
}

export async function getVaultStats(userId: string): Promise<VaultStats> {
  const [projectCount, trackCount, folderCount, versionData] = await Promise.all([
    db
      .select({ count: count() })
      .from(project)
      .where(eq(project.userId, userId)),
    
    db
      .select({ count: count() })
      .from(track)
      .where(eq(track.userId, userId)),
    
    db
      .select({ count: count() })
      .from(folder)
      .where(eq(folder.userId, userId)),

    // Get version data from tracks that have userId
    db
      .select({ 
        versionCount: count(trackVersion.id),
        totalSize: count(trackVersion.size), // Sum when we have size field
        totalDuration: count(trackVersion.duration) // Sum when we have duration field
      })
      .from(trackVersion)
      .leftJoin(track, eq(track.id, trackVersion.trackId))
      .where(eq(track.userId, userId))
  ])

  return {
    totalFolders: folderCount[0]?.count || 0,
    totalProjects: projectCount[0]?.count || 0,
    totalTracks: trackCount[0]?.count || 0,
    totalVersions: versionData[0]?.versionCount || 0,
    totalSize: versionData[0]?.totalSize || 0, // TODO: Implement proper sum when we have size field
    totalDuration: versionData[0]?.totalDuration || 0 // TODO: Implement proper sum when we have duration field
  }
}

// ================================
// CONVENIENCE FUNCTIONS
// ================================

// For sidebar navigation
export async function getSidebarData(userId: string): Promise<VaultData> {
  return getVaultData(userId, {
    includeHierarchy: true,
    includeLevels: false
  })
}

// For move dialogs
export async function getHierarchicalFolders(userId: string, excludeFolderId?: string): Promise<VaultFolder[]> {
  const data = await getVaultData(userId, {
    includeHierarchy: true,
    includeLevels: true,
    excludeFolderId
  })
  return data.folders
}

// For folder views with breadcrumbs
export async function getFolderData(folderId: string, userId: string): Promise<VaultData> {
  return getVaultData(userId, {
    includeHierarchy: false,
    includePath: true,
    specificFolderId: folderId
  })
}



 