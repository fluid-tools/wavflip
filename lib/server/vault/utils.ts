import { db } from '@/db';
import { folder, project } from '@/db/schema/vault';
import { eq, isNull, not, and } from 'drizzle-orm';


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
