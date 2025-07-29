import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth-server'
import { getFolderWithContents, getAllUserFolders } from '@/server/library'
import { FolderView } from '@/components/library/folders/view'

interface FolderPageProps {
  params: Promise<{
    folderId: string
  }>
}

export default async function FolderPage({ params }: FolderPageProps) {
  // Parallelize auth check and params extraction
  const [session, { folderId }] = await Promise.all([
    requireAuth(),
    params
  ])

  if (!folderId) {
    notFound()
  }

  // Fetch folder data and all folders for move functionality
  const [folder, allFolders] = await Promise.all([
    getFolderWithContents(folderId, session.user.id),
    getAllUserFolders(session.user.id)
  ])

  if (!folder) {
    notFound()
  }

  return <FolderView folder={folder} allFolders={allFolders} />
} 