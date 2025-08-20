import 'server-only';

import { and, count, eq, isNull, not } from 'drizzle-orm';
import { db } from '@/db';
import { folder, project, track } from '@/db/schema/vault';
import type { FolderWithProjects } from '@/lib/contracts/folder';
import { FolderWithProjectsSchema } from '@/lib/contracts/folder';
import type {
  BreadcrumbItem,
  VaultData,
  VaultFolder,
} from '@/lib/contracts/vault';
import { VaultDataSchema } from '@/lib/contracts/vault';

// Local options type for server composition
type VaultQueryOptions = {
  includePath?: boolean;
  includeHierarchy?: boolean;
  excludeFolderId?: string;
  specificFolderId?: string;
  includeLevels?: boolean;
};

// ================================
// CORE DATA FETCHING
// ================================

export async function getVaultData(
  userId: string,
  options: VaultQueryOptions = {}
): Promise<VaultData> {
  const {
    includePath = false,
    includeHierarchy = true,
    excludeFolderId,
    specificFolderId,
    includeLevels = false,
  } = options;

  // Build folder query with exclusions
  const whereConditions = [eq(folder.userId, userId)];
  if (excludeFolderId) {
    whereConditions.push(not(eq(folder.id, excludeFolderId)));
  }

  const allFolders = await db
    .select()
    .from(folder)
    .where(and(...whereConditions))
    .orderBy(folder.order, folder.createdAt);

  // Optimize: Get ALL projects for this user in a single query instead of N+1
  const allProjects = await db
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
      trackCount: count(track.id),
    })
    .from(project)
    .leftJoin(track, eq(track.projectId, project.id))
    .where(eq(project.userId, userId))
    .groupBy(project.id)
    .orderBy(project.order, project.createdAt);

  // Group projects by folder ID for O(1) lookup
  const projectsByFolder = new Map<string, typeof allProjects>();
  allProjects.forEach((proj) => {
    if (proj.folderId) {
      if (!projectsByFolder.has(proj.folderId)) {
        projectsByFolder.set(proj.folderId, []);
      }
      projectsByFolder.get(proj.folderId)!.push(proj);
    }
  });

  // Calculate total project count including nested projects
  const calculateTotalProjectCount = (folders: VaultFolder[]): number => {
    return folders.reduce((total, folder) => {
      return (
        total +
        folder.projects.length +
        calculateTotalProjectCount(folder.subfolders)
      );
    }, 0);
  };

  // Build hierarchical structure
  const buildHierarchy = (
    parentId: string | null = null,
    level = 0
  ): VaultFolder[] => {
    return allFolders
      .filter((f) => f.parentFolderId === parentId)
      .map((f) => {
        const projects = projectsByFolder.get(f.id) || [];
        const subfolders = includeHierarchy
          ? buildHierarchy(f.id, level + 1)
          : [];

        const folder: VaultFolder = {
          id: f.id,
          name: f.name,
          parentFolderId: f.parentFolderId,
          projects,
          subfolders,
          projectCount:
            projects.length + calculateTotalProjectCount(subfolders),
          subFolderCount: subfolders.length,
        };

        if (includeLevels) {
          folder.level = level;
        }

        return folder;
      });
  };

  // Get root projects (not in any folder) - filter from already fetched projects
  const rootProjects = allProjects.filter((proj) => !proj.folderId);

  const result: VaultData = {
    folders: buildHierarchy(),
    rootProjects,
  };

  // Add path if requested
  if (includePath && specificFolderId) {
    result.path = await getFolderPath(specificFolderId, userId);
  }

  // Validate composed data against contract for consistency
  return VaultDataSchema.parse(result);
}

// ================================
// SPECIFIC DATA HELPERS
// ================================

async function getFolderPath(
  folderId: string,
  userId: string
): Promise<BreadcrumbItem[]> {
  type DbFolderRow = {
    id: string;
    name: string;
    parentFolderId: string | null;
  };
  const path: BreadcrumbItem[] = [];
  let currentFolderId: string | null = folderId;

  while (currentFolderId) {
    const folderData: DbFolderRow[] = await db
      .select()
      .from(folder)
      .where(and(eq(folder.id, currentFolderId), eq(folder.userId, userId)))
      .limit(1);

    if (folderData.length === 0) {
      throw new Error('Folder not found');
    }

    const currentFolder = folderData[0];
    path.unshift({
      id: currentFolder.id,
      name: currentFolder.name,
      parentFolderId: currentFolder.parentFolderId,
    });

    currentFolderId = currentFolder.parentFolderId;
  }

  return path;
}

// todo: will use this for usage stats in billing
// const getVaultStats = async (userId: string): Promise<VaultStats> => {
//   const [projectCount, trackCount, folderCount, versionData] = await Promise.all([
//     db
//       .select({ count: count() })
//       .from(project)
//       .where(eq(project.userId, userId)),

//     db
//       .select({ count: count() })
//       .from(track)
//       .where(eq(track.userId, userId)),

//     db
//       .select({ count: count() })
//       .from(folder)
//       .where(eq(folder.userId, userId)),

//     // Get version data from tracks that have userId
//     db
//       .select({
//         versionCount: count(trackVersion.id),
//         totalSize: count(trackVersion.size), // Sum when we have size field
//         totalDuration: count(trackVersion.duration) // Sum when we have duration field
//       })
//       .from(trackVersion)
//       .leftJoin(track, eq(track.id, trackVersion.trackId))
//       .where(eq(track.userId, userId))
//   ])

//   return {
//     totalFolders: folderCount[0]?.count || 0,
//     totalProjects: projectCount[0]?.count || 0,
//     totalTracks: trackCount[0]?.count || 0,
//     totalVersions: versionData[0]?.versionCount || 0,
//     totalSize: versionData[0]?.totalSize || 0, // TODO: Implement proper sum when we have size field
//     totalDuration: versionData[0]?.totalDuration || 0 // TODO: Implement proper sum when we have duration field
//   }
// }

// ================================
// CONVENIENCE FUNCTIONS
// ================================

// For folder views with breadcrumbs
export async function getFolderData(
  folderId: string,
  userId: string
): Promise<VaultData> {
  return getVaultData(userId, {
    includeHierarchy: false,
    includePath: true,
    specificFolderId: folderId,
  });
}
// ================================
// DATA FETCHING OPERATIONS
// ================================

export async function getUserFolders(
  userId: string
): Promise<FolderWithProjects[]> {
  // Only get root-level folders (parentFolderId is null)
  const folders = await db
    .select()
    .from(folder)
    .where(and(eq(folder.userId, userId), isNull(folder.parentFolderId)))
    .orderBy(folder.order, folder.createdAt);

  // Optimize: Get ALL folders and projects for this user in batch
  const [allUserFolders, allUserProjects] = await Promise.all([
    db
      .select()
      .from(folder)
      .where(eq(folder.userId, userId))
      .orderBy(folder.order, folder.createdAt),
    
    db
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
        trackCount: count(track.id),
      })
      .from(project)
      .leftJoin(track, eq(track.projectId, project.id))
      .where(eq(project.userId, userId))
      .groupBy(project.id)
      .orderBy(project.order, project.createdAt),
  ]);

  // Create lookup maps for O(1) access
  const folderMap = new Map(allUserFolders.map(f => [f.id, f]));
  const projectsByFolder = new Map<string, typeof allUserProjects>();
  const childrenByParent = new Map<string, typeof allUserFolders>();

  // Group data by relationships
  allUserProjects.forEach((proj) => {
    if (proj.folderId) {
      if (!projectsByFolder.has(proj.folderId)) {
        projectsByFolder.set(proj.folderId, []);
      }
      projectsByFolder.get(proj.folderId)!.push(proj);
    }
  });

  allUserFolders.forEach((f) => {
    if (f.parentFolderId) {
      if (!childrenByParent.has(f.parentFolderId)) {
        childrenByParent.set(f.parentFolderId, []);
      }
      childrenByParent.get(f.parentFolderId)!.push(f);
    }
  });

  // Build folder content recursively with memoization
  const folderContentCache = new Map<string, FolderWithProjects>();
  
  const buildFolderContent = (folderId: string): FolderWithProjects | null => {
    if (folderContentCache.has(folderId)) {
      return folderContentCache.get(folderId)!;
    }

    const folderData = folderMap.get(folderId);
    if (!folderData) {
      return null;
    }

    const directProjects = projectsByFolder.get(folderId) || [];
    const childFolders = childrenByParent.get(folderId) || [];
    
    const subFolders = childFolders
      .map(cf => buildFolderContent(cf.id))
      .filter((content): content is FolderWithProjects => content !== null);

    // Calculate total project count including nested content
    const calculateTotalProjectCount = (folders: FolderWithProjects[]): number => {
      return folders.reduce((total, folder) => {
        return (
          total +
          (folder.projects?.length || 0) +
          calculateTotalProjectCount(folder.subFolders || [])
        );
      }, 0);
    };

    const nestedProjectCount = calculateTotalProjectCount(subFolders);
    const totalProjectCount = directProjects.length + nestedProjectCount;

    const result = FolderWithProjectsSchema.parse({
      ...folderData,
      subFolders,
      projects: directProjects,
      subFolderCount: subFolders.length,
      projectCount: totalProjectCount,
    });

    folderContentCache.set(folderId, result);
    return result;
  };

  return folders
    .map(f => buildFolderContent(f.id))
    .filter((content): content is FolderWithProjects => content !== null);
}

export async function getFolderWithContents(
  folderId: string,
  userId: string
): Promise<FolderWithProjects | null> {
  // Use the optimized batch approach for single folder as well
  const allUserFolders = await getUserFolders(userId);
  
  // Find the specific folder in the result or search recursively
  const findFolder = (folders: FolderWithProjects[], targetId: string): FolderWithProjects | null => {
    for (const folder of folders) {
      if (folder.id === targetId) {
        return folder;
      }
      const found = findFolder(folder.subFolders || [], targetId);
      if (found) {
        return found;
      }
    }
    return null;
  };

  return findFolder(allUserFolders, folderId);
}
