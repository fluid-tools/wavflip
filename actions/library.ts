'use server'

import { revalidatePath } from 'next/cache'
import { 
  createFolder, createProject, createTrack, createTrackVersion,
  deleteFolder, deleteProject, deleteTrack,
  renameFolder, renameProject, renameTrack,
  moveProject, getUserFolders, getVaultProjects, getFolderWithContents
} from '@/lib/library-db'
import { requireAuth } from '@/lib/auth-server'
import type { Folder, Project, Track } from '@/db/schema/library'

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

type TrackActionState = {
  success: boolean
  error: string | null
  track?: Track
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
    let existingFolders
    if (parentFolderId) {
      // Get sibling folders (same parent)
      const parentFolder = await getFolderWithContents(parentFolderId, session.user.id)
      existingFolders = parentFolder?.subFolders || []
    } else {
      // Get root level folders
      existingFolders = await getUserFolders(session.user.id)
    }
    
    const existingNames = new Set(existingFolders.map((f: Folder) => f.name))
    
    let folderName = name.trim()
    if (existingNames.has(folderName)) {
      let counter = 1
      let newName = `${folderName} (${counter})`
      
      while (existingNames.has(newName)) {
        counter++
        newName = `${folderName} (${counter})`
      }
      
      folderName = newName
    }

    const folder = await createFolder({
      name: folderName,
      parentFolderId: parentFolderId || null,
      userId: session.user.id,
      order: 0,
    })

    // Revalidate appropriate path
    if (parentFolderId) {
      revalidatePath(`/library/folders/${parentFolderId}`)
    } else {
      revalidatePath('/library')
    }
    
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
    let existingProjects
    if (folderId) {
      const folders = await getUserFolders(session.user.id)
      const folder = folders.find((f: Folder) => f.id === folderId)
      existingProjects = folder?.projects || []
    } else {
      existingProjects = await getVaultProjects(session.user.id)
    }
    
    const existingNames = new Set(existingProjects.map((p: Project) => p.name))
    
    let projectName = name.trim()
    if (existingNames.has(projectName)) {
      let counter = 1
      let newName = `${projectName} (${counter})`
      
      while (existingNames.has(newName)) {
        counter++
        newName = `${projectName} (${counter})`
      }
      
      projectName = newName
    }

    const project = await createProject({
      name: projectName,
      folderId: folderId || null,
      userId: session.user.id,
      accessType: 'private',
      order: 0,
    })

    // Revalidate the appropriate path
    if (folderId) {
      revalidatePath(`/library/folders/${folderId}`)
    } else {
      revalidatePath('/library')
    }

    return { success: true, project, error: null }
  } catch (error) {
    console.error('Failed to create project:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create project' 
    }
  }
}

export async function createTrackAction(prevState: TrackActionState, formData: FormData): Promise<TrackActionState> {
  try {
    const session = await requireAuth()
    const name = formData.get('name') as string
    const projectId = formData.get('projectId') as string
    const fileUrl = formData.get('fileUrl') as string
    const fileSize = formData.get('fileSize') as string
    const mimeType = formData.get('mimeType') as string

    if (!name || name.trim().length === 0) {
      return { success: false, error: 'Track name is required' }
    }

    if (!projectId) {
      return { success: false, error: 'Project ID is required' }
    }

    if (!fileUrl) {
      return { success: false, error: 'File URL is required' }
    }

    // Create track
    const track = await createTrack({
      name: name.trim(),
      projectId,
      userId: session.user.id,
      order: 0,
    })

    // Create first version with the uploaded file
    await createTrackVersion({
      trackId: track.id,
      fileUrl,
      size: parseInt(fileSize) || 0,
      duration: 0, // Will be determined client-side when played
      mimeType: mimeType || 'audio/mpeg',
    })

    revalidatePath(`/library/projects/${projectId}`)
    return { success: true, track, error: null }
  } catch (error) {
    console.error('Failed to create track:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create track' 
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

    // Revalidate the correct parent path
    if (parentFolderId) {
      revalidatePath(`/library/folders/${parentFolderId}`)
    } else {
      revalidatePath('/library')
    }

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

    // Revalidate appropriate path
    if (folderId) {
      revalidatePath(`/library/folders/${folderId}`)
    } else {
      revalidatePath('/library')
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Failed to delete project:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete project' 
    }
  }
}

export async function deleteTrackAction(prevState: DeleteActionState, formData: FormData): Promise<DeleteActionState> {
  try {
    const session = await requireAuth()
    const trackId = formData.get('trackId') as string
    const projectId = formData.get('projectId') as string

    if (!trackId) {
      return { success: false, error: 'Track ID is required' }
    }

    await deleteTrack(trackId, session.user.id)

    if (projectId) {
      revalidatePath(`/library/projects/${projectId}`)
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Failed to delete track:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete track' 
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

    revalidatePath('/library')
    revalidatePath(`/library/folders/${folderId}`)
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

    // Revalidate appropriate paths
    if (folderId) {
      revalidatePath(`/library/folders/${folderId}`)
    } else {
      revalidatePath('/library')
    }
    revalidatePath(`/library/projects/${projectId}`)

    return { success: true, error: null }
  } catch (error) {
    console.error('Failed to rename project:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to rename project' 
    }
  }
}

export async function renameTrackAction(prevState: RenameActionState, formData: FormData): Promise<RenameActionState> {
  try {
    const session = await requireAuth()
    const trackId = formData.get('trackId') as string
    const name = formData.get('name') as string
    const projectId = formData.get('projectId') as string

    if (!trackId || !name?.trim()) {
      return { success: false, error: 'Track ID and name are required' }
    }

    await renameTrack(trackId, name, session.user.id)

    if (projectId) {
      revalidatePath(`/library/projects/${projectId}`)
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Failed to rename track:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to rename track' 
    }
  }
}

export async function moveProjectAction(prevState: MoveActionState, formData: FormData): Promise<MoveActionState> {
  try {
    const session = await requireAuth()
    const projectId = formData.get('projectId') as string
    const folderId = formData.get('folderId') as string | null
    const sourceFolderId = formData.get('sourceFolderId') as string | null

    if (!projectId) {
      return { success: false, error: 'Project ID is required' }
    }

    await moveProject(projectId, folderId, session.user.id)

    // Revalidate source and destination paths
    if (sourceFolderId) {
      revalidatePath(`/library/folders/${sourceFolderId}`)
    } else {
      revalidatePath('/library')
    }
    
    if (folderId) {
      revalidatePath(`/library/folders/${folderId}`)
    } else {
      revalidatePath('/library')
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