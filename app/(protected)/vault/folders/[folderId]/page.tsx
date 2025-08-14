import { notFound } from 'next/navigation'
import { getFolderWithContents } from '@/lib/server/vault'
import { FolderView } from '@/app/(protected)/vault/folders/[folderId]/client'
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getCachedSession } from '@/lib/server/auth'
import { redirect } from 'next/navigation'

interface FolderPageProps {
  params: Promise<{
    folderId: string
  }>
}

export default async function FolderPage({ params }: FolderPageProps) {
  // Parallelize session check and params extraction for better performance
  const [session, { folderId }] = await Promise.all([
    getCachedSession(),
    params
  ])

  if (!folderId || !session?.user?.id) redirect('/sign-in')

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