'use server'

import { requireAuth } from '@/lib/server/auth';
import { handleDuplicateFolderName, createFolder, deleteFolder, renameFolder, moveFolder } from '@/lib/server/vault';
import { revalidatePath } from 'next/cache';
import type { FolderActionState, DeleteActionState, RenameActionState, MoveActionState } from './types';


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
