'use server';

import { revalidatePath } from 'next/cache';
import { actionClient } from '@/lib/safe-action';
import { requireAuth } from '@/lib/server/auth';
import {
  createFolder,
  createProject,
  deleteProject,
  getProjectWithTracks,
  handleDuplicateProjectName,
  moveProject,
  renameProject,
} from '@/lib/server/vault';
import {
  combineProjectsSchema,
  createProjectSchema,
  deleteProjectSchema,
  moveProjectSchema,
  renameProjectSchema,
} from './schemas';

export const moveProjectAction = actionClient
  .schema(moveProjectSchema)
  .action(async ({ parsedInput }) => {
    const { projectId, folderId, sourceFolderId } = parsedInput;
    const session = await requireAuth();

    await moveProject(projectId, folderId || null, session.user.id);

    // Revalidate source and destination paths
    if (sourceFolderId) {
      revalidatePath(`/vault/folders/${sourceFolderId}`);
    } else {
      revalidatePath('/vault');
    }

    if (folderId) {
      revalidatePath(`/vault/folders/${folderId}`);
    } else {
      revalidatePath('/vault');
    }

    return { success: true as const };
  });
export const renameProjectAction = actionClient
  .schema(renameProjectSchema)
  .action(async ({ parsedInput }) => {
    const { projectId, name } = parsedInput;
    const session = await requireAuth();

    await renameProject(projectId, name, session.user.id);

    // Revalidate appropriate paths and sidebar
    revalidatePath('/vault');
    revalidatePath(`/vault/projects/${projectId}`);
    revalidatePath('/api/vault/tree');

    return { success: true as const };
  });
export const createProjectAction = actionClient
  .schema(createProjectSchema)
  .action(async ({ parsedInput }) => {
    const { name, folderId } = parsedInput;
    const session = await requireAuth();

    // Handle duplicate names by adding suffix
    const projectName = await handleDuplicateProjectName(
      name,
      folderId || null,
      session.user.id
    );

    const project = await createProject({
      name: projectName,
      folderId: folderId || null,
      userId: session.user.id,
      accessType: 'private',
      order: 0,
    });

    // Revalidate the appropriate paths for UI updates
    if (folderId) {
      revalidatePath(`/vault/folders/${folderId}`);
    } else {
      revalidatePath('/vault');
    }
    // Always revalidate the root vault for sidebar updates
    revalidatePath('/vault');
    revalidatePath('/api/vault/tree');

    return {
      success: true as const,
      project: {
        id: project.id,
        name: project.name,
        folderId: project.folderId,
      },
    };
  });
export const deleteProjectAction = actionClient
  .schema(deleteProjectSchema)
  .action(async ({ parsedInput }) => {
    const { projectId } = parsedInput;
    const session = await requireAuth();

    await deleteProject(projectId, session.user.id);

    // Revalidate appropriate paths and sidebar
    revalidatePath('/vault');
    revalidatePath('/api/vault/tree');

    return { success: true as const };
  });
export const createFolderFromProjectsAction = actionClient
  .schema(combineProjectsSchema)
  .action(async ({ parsedInput }) => {
    const { projectIds, folderName, parentFolderId } = parsedInput;
    const session = await requireAuth();

    if (projectIds.length < 2) {
      throw new Error('At least 2 projects are required');
    }

    // Create a new folder
    const newFolder = await createFolder({
      name: folderName,
      userId: session.user.id,
      parentFolderId: parentFolderId || null,
      order: 0,
    });

    // Move all projects to the new folder
    await Promise.all(
      projectIds.map((projectId) =>
        moveProject(projectId, newFolder.id, session.user.id)
      )
    );

    // Revalidate relevant paths
    if (parentFolderId) {
      revalidatePath(`/vault/folders/${parentFolderId}`);
    } else {
      revalidatePath('/vault');
    }
    revalidatePath(`/vault/folders/${newFolder.id}`);

    return { success: true as const };
  });
