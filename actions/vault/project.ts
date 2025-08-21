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

    return { success: true };
  });
export const renameProjectAction = actionClient
  .schema(renameProjectSchema)
  .action(async ({ parsedInput }) => {
    const { projectId, name, folderId } = parsedInput;
    
    const session = await requireAuth();
    await renameProject(projectId, name, session.user.id);

    // Revalidate appropriate paths and sidebar
    if (folderId) {
      revalidatePath(`/vault/folders/${folderId}`);
    } else {
      revalidatePath('/vault');
    }
    revalidatePath(`/vault/projects/${projectId}`);
    revalidatePath('/api/vault/tree');

    return { success: true };
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

    return { project };
  });
export const deleteProjectAction = actionClient
  .schema(deleteProjectSchema)
  .action(async ({ parsedInput }) => {
    const { projectId, folderId } = parsedInput;
    
    const session = await requireAuth();
    await deleteProject(projectId, session.user.id);

    // Revalidate appropriate paths and sidebar
    if (folderId) {
      revalidatePath(`/vault/folders/${folderId}`);
    } else {
      revalidatePath('/vault');
    }
    // Always revalidate for sidebar updates
    revalidatePath('/vault');
    revalidatePath('/api/vault/tree');

    return { success: true };
  });
export const createFolderFromProjectsAction = actionClient
  .schema(combineProjectsSchema)
  .action(async ({ parsedInput }) => {
    const { sourceProjectId, targetProjectId, parentFolderId } = parsedInput;
    
    const session = await requireAuth();

    // Get project names to create folder name
    const [sourceProject, targetProject] = await Promise.all([
      getProjectWithTracks(sourceProjectId, session.user.id),
      getProjectWithTracks(targetProjectId, session.user.id),
    ]);

    if (!(sourceProject && targetProject)) {
      throw new Error('One or both projects not found');
    }

    // Create a new folder with a combined name
    const folderName = `${sourceProject.name} & ${targetProject.name}`;

    const newFolder = await createFolder({
      name: folderName,
      userId: session.user.id,
      parentFolderId: parentFolderId || null,
      order: 0,
    });

    // Move both projects to the new folder
    await Promise.all([
      moveProject(sourceProjectId, newFolder.id, session.user.id),
      moveProject(targetProjectId, newFolder.id, session.user.id),
    ]);

    // Revalidate relevant paths
    if (parentFolderId) {
      revalidatePath(`/vault/folders/${parentFolderId}`);
    } else {
      revalidatePath('/vault');
    }
    revalidatePath(`/vault/folders/${newFolder.id}`);

    return { success: true };
  });
