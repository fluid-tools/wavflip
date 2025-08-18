import 'server-only';

import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '@/db';
import { project, track, trackVersion } from '@/db/schema/vault';
// Use contract row type not DB inferred types
import type { Project } from '@/lib/contracts/project';
import {
  ProjectCreateDataSchema,
  ProjectRowSchema,
  ProjectWithTracksSchema,
} from '@/lib/contracts/project';
import { getPresignedImageUrl } from '@/lib/storage/s3-storage';

// Resource-first helpers (no auth)
const getProjectById = async (projectId: string): Promise<Project | null> => {
  const [result] = await db
    .select()
    .from(project)
    .where(eq(project.id, projectId))
    .limit(1);
  return result ? ProjectRowSchema.parse(result) : null;
};

// getor404 project
export const getProjectOr404 = async (projectId: string): Promise<Project> => {
  const project = await getProjectById(projectId);
  if (!project)
    throw Object.assign(new Error('Project not found'), { status: 404 });
  return project;
};

export const requireProjectOwnership = (
  record: Project,
  userId: string
): void => {
  if (record.userId !== userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
};

export const getPresignedImageUrlForProject = async (
  projectId: string,
  options: { requireOwnerUserId?: string; expiresInSeconds?: number } = {}
): Promise<string | null> => {
  const { requireOwnerUserId, expiresInSeconds = 60 * 5 } = options;
  const record = await getProjectOr404(projectId);
  if (requireOwnerUserId) requireProjectOwnership(record, requireOwnerUserId);
  if (!record.image) return null;
  return getPresignedImageUrl(record.image, projectId, expiresInSeconds);
};

// Mutation: set image key (resource-first; policy enforced by route or higher-level callers)
export const setProjectImageKey = async (
  projectId: string,
  imageKey: string
): Promise<void> => {
  await db
    .update(project)
    .set({ image: imageKey, updatedAt: new Date() })
    .where(eq(project.id, projectId));
};
export async function getVaultProjects(userId: string) {
  const projects = await db
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
    .where(and(eq(project.userId, userId), isNull(project.folderId)))
    .groupBy(project.id)
    .orderBy(project.order, project.createdAt);

  // Sort to ensure Generations project appears first if it exists
  const sortedProjects = projects.sort((a, b) => {
    if (a.id === 'system-generations') return -1;
    if (b.id === 'system-generations') return 1;
    return a.order - b.order || a.createdAt.getTime() - b.createdAt.getTime();
  });

  return sortedProjects.map((p) => ({ ...p, tracks: [] }));
}

export async function getProjectWithTracks(projectId: string, userId: string) {
  const [proj] = await db
    .select()
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.userId, userId)));

  if (!proj) return null;

  const tracks = await db
    .select()
    .from(track)
    .where(eq(track.projectId, projectId))
    .orderBy(track.order, track.createdAt);

  const tracksWithVersions = await Promise.all(
    tracks.map(async (t) => {
      const versions = await db
        .select()
        .from(trackVersion)
        .where(eq(trackVersion.trackId, t.id))
        .orderBy(desc(trackVersion.version));

      const activeVersion = t.activeVersionId
        ? versions.find((v) => v.id === t.activeVersionId)
        : undefined;

      return { ...t, versions, activeVersion, project: proj };
    })
  );

  return ProjectWithTracksSchema.parse({
    ...proj,
    tracks: tracksWithVersions,
    trackCount: tracksWithVersions.length,
  });
}

// ================================
// PROJECT CRUD OPERATIONS
// ================================

import type { ProjectCreateData } from '@/lib/contracts/project';

export async function createProject(data: ProjectCreateData): Promise<Project> {
  const now = new Date();
  const base = ProjectCreateDataSchema.parse(data);
  const newProject = {
    ...base,
    id: nanoid(),
    createdAt: now,
    updatedAt: now,
  };

  const [createdProject] = await db
    .insert(project)
    .values(newProject)
    .returning();
  return ProjectRowSchema.parse(createdProject);
}

export async function deleteProject(
  projectId: string,
  userId: string
): Promise<void> {
  await db
    .delete(project)
    .where(and(eq(project.id, projectId), eq(project.userId, userId)));
}

export async function renameProject(
  projectId: string,
  name: string,
  userId: string
): Promise<void> {
  await db
    .update(project)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(project.id, projectId), eq(project.userId, userId)));
}

export async function moveProject(
  projectId: string,
  folderId: string | null,
  userId: string
): Promise<void> {
  await db
    .update(project)
    .set({ folderId, updatedAt: new Date() })
    .where(and(eq(project.id, projectId), eq(project.userId, userId)));
}

// removed unused type-only helper
