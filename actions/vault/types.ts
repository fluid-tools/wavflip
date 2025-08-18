import type { FolderRow } from '@/lib/contracts/folder';
import type { ProjectRow } from '@/lib/contracts/project';


export type FolderActionState = {
  success: boolean
  error: string | null
  folder?: FolderRow
}

export type ProjectActionState = {
  success: boolean
  error: string | null
  project?: ProjectRow
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
