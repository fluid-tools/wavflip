import 'server-only'

import { db } from '@/db'
import { project, track, trackVersion } from '@/db/schema/vault'
import { eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import type { ProjectWithTracks } from '@/db/schema/vault'

const GENERATIONS_PROJECT_ID = 'system-generations'
const GENERATIONS_PROJECT_NAME = 'Generations'

/**
 * Get or create the special Generations project for a user
 */
export async function getOrCreateGenerationsProject(userId: string): Promise<ProjectWithTracks> {
  // Check if generations project exists
  const [existingProject] = await db
    .select()
    .from(project)
    .where(and(
      eq(project.id, GENERATIONS_PROJECT_ID),
      eq(project.userId, userId)
    ))
    .limit(1)

  if (existingProject) {
    // Fetch tracks for the project
    const tracks = await db
      .select()
      .from(track)
      .where(eq(track.projectId, GENERATIONS_PROJECT_ID))
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
    id: GENERATIONS_PROJECT_ID,
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
    fileUrl: string
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
    projectId: GENERATIONS_PROJECT_ID,
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
    fileUrl: soundData.fileUrl,
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
 * Check if a project is the system Generations project
 */
export function isGenerationsProject(projectId: string): boolean {
  return projectId === GENERATIONS_PROJECT_ID
}

/**
 * Get the Generations project ID
 */
export function getGenerationsProjectId(): string {
  return GENERATIONS_PROJECT_ID
}