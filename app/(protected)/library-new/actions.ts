'use server'

import { revalidatePath } from 'next/cache'
import { createFolder, createProject } from '@/lib/library-db'
import { requireAuth } from '@/lib/auth-server'
import type { Folder, Project } from '@/db/schema/library'

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

export async function createFolderAction(prevState: FolderActionState, formData: FormData): Promise<FolderActionState> {
  try {
    const session = await requireAuth()
    const name = formData.get('name') as string

    if (!name || name.trim().length === 0) {
      return { success: false, error: 'Folder name is required' }
    }

    const folder = await createFolder({
      name: name.trim(),
      userId: session.user.id,
      order: 0,
    })

    revalidatePath('/library-new')
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

    const project = await createProject({
      name: name.trim(),
      folderId: folderId || null,
      userId: session.user.id,
      accessType: 'private',
      order: 0,
    })

    // Revalidate the appropriate path
    if (folderId) {
      revalidatePath(`/library-new/folders/${folderId}`)
    } else {
      revalidatePath('/library-new')
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