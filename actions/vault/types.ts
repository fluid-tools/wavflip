import type { Folder, Project } from '@/db/schema/vault';


export type FolderActionState = {
  success: boolean
  error: string | null
  folder?: Folder
}

export type ProjectActionState = {
  success: boolean
  error: string | null
  project?: Project
}

export type DeleteActionState = {
  success: boolean
  error: string | null
}

export type RenameActionState = {
  success: boolean
  error: string | null
}

export type MoveActionState = {
  success: boolean
  error: string | null
}
