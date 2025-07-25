import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth-server'
import { getFolderWithContents } from '@/lib/library-db'
import { FolderView } from '@/components/library/folders/folder-view'

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

  // Fetch folder data server-side with subfolders and projects
  const folder = await getFolderWithContents(folderId, session.user.id)

  if (!folder) {
    notFound()
  }

  return <FolderView folder={folder} />
} 