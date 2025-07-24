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
  const session = await requireAuth()
  const { folderId } = await params

  if (!folderId) {
    notFound()
  }

  // Fetch folder data server-side
  const folders = await getUserFolders(session.user.id)
  const folder = folders.find(f => f.id === folderId)

  if (!folder) {
    notFound()
  }

  return (
    <div className="flex flex-col h-full">
      <FolderView folder={folder} />
    </div>
  )
} 