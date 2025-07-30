import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth-server'
import { getFolderWithContents } from '@/server/vault'
import { FolderView } from '@/app/(protected)/vault/folders/[folderId]/client'

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

  // Fetch folder data
  const folder = await getFolderWithContents(folderId, session.user.id)

  if (!folder) {
    notFound()
  }

  return <FolderView folder={folder} />
} 