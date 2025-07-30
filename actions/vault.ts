'use server'

import { revalidatePath } from 'next/cache'
import {
  createFolder, createProject,
  deleteFolder, deleteProject,
  renameFolder, renameProject,
  moveFolder, moveProject,
  getProjectWithTracks,
  handleDuplicateFolderName,
  handleDuplicateProjectName
} from '@/lib/server/vault'
import { requireAuth } from '@/lib/server/auth'
import type { Folder, Project } from '@/db/schema/vault'

type FolderActionState = {
  success: boolean
  error: string | null
  folder?: Folder
}

type ProjectActionState = {
  success: boolean
  error: string | null
  project?: Project
}

type DeleteActionState = {
  success: boolean
  error: string | null
}

type RenameActionState = {
  success: boolean
  error: string | null
}

type MoveActionState = {
  success: boolean
  error: string | null
}

export async function createFolderAction(prevState: FolderActionState, formData: FormData): Promise<FolderActionState> {
  try {
    const session = await requireAuth()
    const name = formData.get('name') as string
    const parentFolderId = formData.get('parentFolderId') as string | null

    if (!name || name.trim().length === 0) {
      return { success: false, error: 'Folder name is required' }
    }

    // Handle duplicate names by adding suffix
    const folderName = await handleDuplicateFolderName(
      name,
      parentFolderId || null,
      session.user.id
    )

    const folder = await createFolder({
      name: folderName,
      parentFolderId: parentFolderId || null,
      userId: session.user.id,
      order: 0,
    })

    // Revalidate appropriate paths for UI updates
    if (parentFolderId) {
      revalidatePath(`/vault/folders/${parentFolderId}`)
    } else {
      revalidatePath('/vault')
    }
    // Always revalidate the root vault for sidebar updates
    revalidatePath('/vault')
    revalidatePath('/api/vault/sidebar')

    return { success: true, folder, error: null }
  } catch (error) {
    console.error('Failed to create folder:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create folder'
    }
  }
}

export async function createProjectAction(prevState: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  try {
    const session = await requireAuth()
    const name = formData.get('name') as string
    const folderId = formData.get('folderId') as string | null

    if (!name || name.trim().length === 0) {
      return { success: false, error: 'Project name is required' }
    }

    // Handle duplicate names by adding suffix
    const projectName = await handleDuplicateProjectName(
      name,
      folderId || null,
      session.user.id
    )

    const project = await createProject({
      name: projectName,
      folderId: folderId || null,
      userId: session.user.id,
      accessType: 'private',
      order: 0,
    })

    // Revalidate the appropriate paths for UI updates
    if (folderId) {
      revalidatePath(`/vault/folders/${folderId}`)
    } else {
      revalidatePath('/vault')
    }
    // Always revalidate the root vault for sidebar updates
    revalidatePath('/vault')
    revalidatePath('/api/vault/sidebar')

    return { success: true, project, error: null }
  } catch (error) {
    console.error('Failed to create project:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project'
    }
  }
}

export async function deleteFolderAction(prevState: DeleteActionState, formData: FormData): Promise<DeleteActionState> {
  try {
    const session = await requireAuth()
    const folderId = formData.get('folderId') as string

    if (!folderId) {
      return { success: false, error: 'Folder ID is required' }
    }

    const { parentFolderId } = await deleteFolder(folderId, session.user.id)

    // Revalidate the correct parent path and sidebar
    if (parentFolderId) {
      revalidatePath(`/vault/folders/${parentFolderId}`)
    } else {
      revalidatePath('/vault')
    }
    // Always revalidate for sidebar updates
    revalidatePath('/vault')
    revalidatePath('/api/vault/sidebar')

    return { success: true, error: null }
  } catch (error) {
    console.error('Failed to delete folder:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete folder'
    }
  }
}

export async function deleteProjectAction(prevState: DeleteActionState, formData: FormData): Promise<DeleteActionState> {
  try {
    const session = await requireAuth()
    const projectId = formData.get('projectId') as string
    const folderId = formData.get('folderId') as string | null

    if (!projectId) {
      return { success: false, error: 'Project ID is required' }
    }

    await deleteProject(projectId, session.user.id)

    // Revalidate appropriate paths and sidebar
    if (folderId) {
      revalidatePath(`/vault/folders/${folderId}`)
    } else {
      revalidatePath('/vault')
    }
    // Always revalidate for sidebar updates
    revalidatePath('/vault')
    revalidatePath('/api/vault/sidebar')

    return { success: true, error: null }
  } catch (error) {
    console.error('Failed to delete project:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project'
    }
  }
}

export async function renameFolderAction(prevState: RenameActionState, formData: FormData): Promise<RenameActionState> {
  try {
    const session = await requireAuth()
    const folderId = formData.get('folderId') as string
    const name = formData.get('name') as string

    if (!folderId || !name?.trim()) {
      return { success: false, error: 'Folder ID and name are required' }
    }

    await renameFolder(folderId, name, session.user.id)

    // Revalidate all relevant paths and sidebar
    revalidatePath('/vault')
    revalidatePath(`/vault/folders/${folderId}`)
    revalidatePath('/api/vault/sidebar')
    return { success: true, error: null }
  } catch (error) {
    console.error('Failed to rename folder:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to rename folder'
    }
  }
}

export async function renameProjectAction(prevState: RenameActionState, formData: FormData): Promise<RenameActionState> {
  try {
    const session = await requireAuth()
    const projectId = formData.get('projectId') as string
    const name = formData.get('name') as string
    const folderId = formData.get('folderId') as string | null

    if (!projectId || !name?.trim()) {
      return { success: false, error: 'Project ID and name are required' }
    }

    await renameProject(projectId, name, session.user.id)

    // Revalidate appropriate paths and sidebar
    if (folderId) {
      revalidatePath(`/vault/folders/${folderId}`)
    } else {
      revalidatePath('/vault')
    }
    revalidatePath(`/vault/projects/${projectId}`)
    revalidatePath('/api/vault/sidebar')

    return { success: true, error: null }
  } catch (error) {
    console.error('Failed to rename project:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to rename project'
    }
  }
}

export async function moveFolderAction(prevState: MoveActionState, formData: FormData): Promise<MoveActionState> {
  try {
    const session = await requireAuth()
    const folderId = formData.get('folderId') as string
    const rawParentFolderId = formData.get('parentFolderId') as string
    const rawSourceParentFolderId = formData.get('sourceParentFolderId') as string

    if (!folderId) {
      return { success: false, error: 'Folder ID is required' }
    }

    // Convert empty strings to null for root placement
    const parentFolderId = rawParentFolderId === '' ? null : rawParentFolderId
    const sourceParentFolderId = rawSourceParentFolderId === '' ? null : rawSourceParentFolderId

    await moveFolder(folderId, parentFolderId, session.user.id)

    // Revalidate source and destination paths
    if (sourceParentFolderId) {
      revalidatePath(`/vault/folders/${sourceParentFolderId}`)
    } else {
      revalidatePath('/vault')
    }

    if (parentFolderId) {
      revalidatePath(`/vault/folders/${parentFolderId}`)
    } else {
      revalidatePath('/vault')
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Failed to move folder:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to move folder'
    }
  }
}

export async function moveProjectAction(prevState: MoveActionState, formData: FormData): Promise<MoveActionState> {
  try {
    const session = await requireAuth()
    const projectId = formData.get('projectId') as string
    const rawFolderId = formData.get('folderId') as string
    const rawSourceFolderId = formData.get('sourceFolderId') as string

    if (!projectId) {
      return { success: false, error: 'Project ID is required' }
    }

    // Convert empty strings to null for root placement
    const folderId = rawFolderId === '' ? null : rawFolderId
    const sourceFolderId = rawSourceFolderId === '' ? null : rawSourceFolderId

    await moveProject(projectId, folderId, session.user.id)

    // Revalidate source and destination paths
    if (sourceFolderId) {
      revalidatePath(`/vault/folders/${sourceFolderId}`)
    } else {
      revalidatePath('/vault')
    }

    if (folderId) {
      revalidatePath(`/vault/folders/${folderId}`)
    } else {
      revalidatePath('/vault')
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Failed to move project:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to move project'
    }
  }
}

export async function createFolderFromProjectsAction(prevState: MoveActionState, formData: FormData): Promise<MoveActionState> {
  try {
    const session = await requireAuth()
    const sourceProjectId = formData.get('sourceProjectId') as string
    const targetProjectId = formData.get('targetProjectId') as string
    const parentFolderId = formData.get('parentFolderId') as string | null

    if (!sourceProjectId || !targetProjectId) {
      return { success: false, error: 'Both project IDs are required' }
    }

    if (sourceProjectId === targetProjectId) {
      return { success: false, error: 'Cannot combine a project with itself' }
    }

    // Get project names to create folder name
    const [sourceProject, targetProject] = await Promise.all([
      getProjectWithTracks(sourceProjectId, session.user.id),
      getProjectWithTracks(targetProjectId, session.user.id)
    ])

    if (!sourceProject || !targetProject) {
      return { success: false, error: 'One or both projects not found' }
    }

    // Create a new folder with a combined name
    const folderName = `${sourceProject.name} & ${targetProject.name}`

    const newFolder = await createFolder({
      name: folderName,
      userId: session.user.id,
      parentFolderId: (parentFolderId === '' || parentFolderId === 'vault') ? null : parentFolderId,
      order: 0
    })

    // Move both projects to the new folder
    await Promise.all([
      moveProject(sourceProjectId, newFolder.id, session.user.id),
      moveProject(targetProjectId, newFolder.id, session.user.id)
    ])

    // Revalidate relevant paths
    if (parentFolderId) {
      revalidatePath(`/vault/folders/${parentFolderId}`)
    } else {
      revalidatePath('/vault')
    }
    revalidatePath(`/vault/folders/${newFolder.id}`)

    return { success: true, error: null }
  } catch (error) {
    console.error('Failed to create folder from projects:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create folder from projects'
    }
  }
} 