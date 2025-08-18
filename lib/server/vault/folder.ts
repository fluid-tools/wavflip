import { db } from '@/db';
import { folder, project } from '@/db/schema/vault';
import { and, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { FolderCreateDataSchema, FolderRowSchema } from '@/lib/contracts/folder'


// ================================
// FOLDER CRUD OPERATIONS
// ================================

export async function createFolder(data: { name: string; parentFolderId: string | null; userId: string; order: number }) {
  const now = new Date()
  const base = FolderCreateDataSchema.parse(data)
  const newFolder = {
    ...base,
    id: nanoid(),
    createdAt: now,
    updatedAt: now,
  }

  const [createdFolder] = await db.insert(folder).values(newFolder).returning()
  return FolderRowSchema.parse(createdFolder)
}

export async function deleteFolder(folderId: string, userId: string): Promise<{ parentFolderId: string | null} > {
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
