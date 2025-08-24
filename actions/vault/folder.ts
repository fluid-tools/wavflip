'use server';

import { revalidatePath } from 'next/cache';
import { actionClient } from '@/lib/safe-action';
import { requireAuth } from '@/lib/server/auth';
import {
  createFolder,
  deleteFolder,
  moveFolder,
  renameFolder,
} from '@/lib/server/vault/folder';
import { handleDuplicateFolderName } from '@/lib/server/vault/utils';
import {
  createFolderSchema,
  deleteFolderSchema,
  moveFolderSchema,
  renameFolderSchema,
} from './schemas';

export const createFolderAction = actionClient
  .schema(createFolderSchema)
  .action(async ({ parsedInput }) => {
    const { name, parentFolderId } = parsedInput;

    const session = await requireAuth();

    // Handle duplicate names by adding suffix
    const folderName = await handleDuplicateFolderName(
      name,
      parentFolderId || null,
      session.user.id
    );

    const folder = await createFolder({
      name: folderName,
      parentFolderId: parentFolderId || null,
      userId: session.user.id,
      order: 0,
    });

    // Revalidate appropriate paths for UI updates
    if (parentFolderId) {
      revalidatePath(`/vault/folders/${parentFolderId}`);
    } else {
      revalidatePath('/vault');
    }
    // Always revalidate the root vault for sidebar updates
    revalidatePath('/vault');
    revalidatePath('/api/vault/tree');

    return { folder };
  });

export const deleteFolderAction = actionClient
  .schema(deleteFolderSchema)
  .action(async ({ parsedInput }) => {
    const { folderId } = parsedInput;

    const session = await requireAuth();
    const { parentFolderId } = await deleteFolder(folderId, session.user.id);

    // Revalidate the correct parent path and sidebar
    if (parentFolderId) {
      revalidatePath(`/vault/folders/${parentFolderId}`);
    } else {
      revalidatePath('/vault');
    }
    // Always revalidate for sidebar updates
    revalidatePath('/vault');
    revalidatePath('/api/vault/tree');

    return { success: true };
  });

export const renameFolderAction = actionClient
  .schema(renameFolderSchema)
  .action(async ({ parsedInput }) => {
    const { folderId, name } = parsedInput;

    const session = await requireAuth();
    await renameFolder(folderId, name, session.user.id);

    // Revalidate all relevant paths and sidebar
    revalidatePath('/vault');
    revalidatePath(`/vault/folders/${folderId}`);
    revalidatePath('/api/vault/tree');

    return { success: true };
  });

export const moveFolderAction = actionClient
  .schema(moveFolderSchema)
  .action(async ({ parsedInput }) => {
    const { folderId, parentFolderId, sourceParentFolderId } = parsedInput;

    const session = await requireAuth();
    await moveFolder(folderId, parentFolderId || null, session.user.id);

    // Revalidate source and destination paths
    if (sourceParentFolderId) {
      revalidatePath(`/vault/folders/${sourceParentFolderId}`);
    } else {
      revalidatePath('/vault');
    }

    if (parentFolderId) {
      revalidatePath(`/vault/folders/${parentFolderId}`);
    } else {
      revalidatePath('/vault');
    }

    return { success: true };
  });
