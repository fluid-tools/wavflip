import { z } from 'zod';

// Constants to replace magic numbers
export const FOLDER_NAME_MAX_LENGTH = 255;
export const PROJECT_NAME_MAX_LENGTH = 255;

// Base validation schemas
export const folderNameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(FOLDER_NAME_MAX_LENGTH, 'Name is too long')
  .trim();

export const projectNameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(PROJECT_NAME_MAX_LENGTH, 'Name is too long')
  .trim();

export const idSchema = z.string().min(1, 'ID is required');

export const optionalIdSchema = z.string().optional().nullable();

// Folder action schemas
export const createFolderSchema = z.object({
  name: folderNameSchema,
  parentFolderId: optionalIdSchema,
});

export const deleteFolderSchema = z.object({
  folderId: idSchema,
});

export const renameFolderSchema = z.object({
  folderId: idSchema,
  name: folderNameSchema,
});

export const moveFolderSchema = z.object({
  folderId: idSchema,
  parentFolderId: optionalIdSchema,
  sourceParentFolderId: optionalIdSchema,
});

// Project action schemas
export const createProjectSchema = z.object({
  name: projectNameSchema,
  folderId: optionalIdSchema,
});

export const deleteProjectSchema = z.object({
  projectId: idSchema,
});

export const renameProjectSchema = z.object({
  projectId: idSchema,
  name: projectNameSchema,
});

export const moveProjectSchema = z.object({
  projectId: idSchema,
  folderId: optionalIdSchema,
  sourceFolderId: optionalIdSchema,
});

export const combineProjectsSchema = z.object({
  projectIds: z.array(idSchema).min(2, 'At least 2 projects required'),
  folderName: folderNameSchema,
  parentFolderId: optionalIdSchema,
});

// Response types inferred from return types
export type FolderActionResult =
  | {
      success: true;
      folder: {
        id: string;
        name: string;
        parentFolderId: string | null;
      };
    }
  | {
      success: false;
      error: string;
    };

export type ProjectActionResult =
  | {
      success: true;
      project: {
        id: string;
        name: string;
        folderId: string | null;
      };
    }
  | {
      success: false;
      error: string;
    };

export type DeleteActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

export type RenameActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

export type MoveActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };
