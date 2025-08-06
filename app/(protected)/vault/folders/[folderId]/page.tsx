import { notFound } from 'next/navigation'
import { getFolderWithContents } from '@/lib/server/vault'
import { FolderView } from '@/app/(protected)/vault/folders/[folderId]/client'
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { requireAuth } from '@/lib/server/auth'

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

  if (!folderId) notFound()

  const queryClient = new QueryClient()

  // Only prefetch folder-specific data (common vault data is handled by layout)
  await queryClient.prefetchQuery({
    queryKey: ['vault', 'folders', folderId],
    queryFn: () => getFolderWithContents(folderId, session.user.id)
  })



  const folder = queryClient.getQueryData(['vault', 'folders', folderId])

  if (!folder) notFound()

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FolderView folderId={folderId} />
    </HydrationBoundary>
  )
} 