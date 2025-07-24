import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth-server'
import { getUserFolders } from '@/lib/library-db'
import { FolderView } from './components/folder-view'

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

  // Fetch folder data server-side
  const folders = await getUserFolders(session.user.id)
  const folder = folders.find(f => f.id === folderId)

  if (!folder) {
    notFound()
  }

  return <FolderView folder={folder} />
} 