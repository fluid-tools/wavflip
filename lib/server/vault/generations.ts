import 'server-only'

import { db } from '@/db'
import { project, track, trackVersion } from '@/db/schema/vault'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import type { ProjectWithTracks } from '@/db/schema/vault'

const GENERATIONS_PROJECT_NAME = 'Generations'

/**
 * Compute a unique project ID for a user's Generations project.
 * Using a deterministic ID ensures the same project is returned for the same user.
 */
function getGenerationsProjectId(userId: string): string {
  return `system-generations-${userId}`
}

/**
 * Get or create the special Generations project for a user
 */
export async function getOrCreateGenerationsProject(userId: string): Promise<ProjectWithTracks> {
  const projectId = getGenerationsProjectId(userId)
  // Check if the user's Generations project exists
  const [existingProject] = await db
    .select()
    .from(project)
    .where(eq(project.id, projectId))
    .limit(1)

  if (existingProject) {
    // Fetch tracks for the project
    const tracks = await db
      .select()
      .from(track)
      .where(eq(track.projectId, projectId))
      .orderBy(track.createdAt)

    const tracksWithVersions = await Promise.all(
      tracks.map(async (t) => {
        const versions = await db
          .select()
          .from(trackVersion)
          .where(eq(trackVersion.trackId, t.id))
          .orderBy(trackVersion.version)

        const activeVersion = t.activeVersionId 
          ? versions.find(v => v.id === t.activeVersionId)
          : versions[0]

        return { ...t, versions, activeVersion, project: existingProject }
      })
    )

    return {
      ...existingProject,
      tracks: tracksWithVersions,
      trackCount: tracksWithVersions.length
    }
  }

  // Create the generations project
  const now = new Date()
  const newProject = {
    id: projectId,
    name: GENERATIONS_PROJECT_NAME,
    userId,
    folderId: null, // Always at root level
    accessType: 'private' as const,
    order: -1, // Always first
    createdAt: now,
    updatedAt: now,
    metadata: {
      isSystem: true,
      deletable: false,
      renameable: false,
      description: 'AI-generated sounds and tracks'
    }
  }

  const [createdProject] = await db
    .insert(project)
    .values(newProject)
    .returning()

  return {
    ...createdProject,
    tracks: [],
    trackCount: 0
  }
}

/**
 * Add a generated sound to the Generations project
 */
export async function addGeneratedSound(
  userId: string,
  soundData: {
    name: string
    fileKey: string
    duration?: number
    size?: number
    mimeType?: string
    prompt?: string
    model?: string
  }
): Promise<void> {
  // Ensure generations project exists
  await getOrCreateGenerationsProject(userId)

  const now = new Date()
  const trackId = nanoid()
  const versionId = nanoid()

  // Create track
  await db.insert(track).values({
    id: trackId,
    name: soundData.name,
    projectId: getGenerationsProjectId(userId),
    userId,
    activeVersionId: versionId,
    accessType: 'private',
    order: 0,
    createdAt: now,
    updatedAt: now,
    metadata: {
      prompt: soundData.prompt,
      model: soundData.model,
      generatedAt: now.toISOString()
    }
  })

  // Create track version
  await db.insert(trackVersion).values({
    id: versionId,
    trackId,
    version: 1,
    fileKey: soundData.fileKey,
    size: soundData.size,
    duration: soundData.duration,
    mimeType: soundData.mimeType || 'audio/mpeg',
    createdAt: now,
    metadata: {
      isGenerated: true
    }
  })
}

/**
 * Check if a project is a Generations project (per‑user).
 * The project IDs are of the form `system-generations-<userId>`.
 */
export function isGenerationsProject(projectId: string): boolean {
  return projectId.startsWith('system-generations-')
}