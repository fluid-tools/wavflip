import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/server/auth'
import { getFolderWithContents } from '@/lib/server/vault'
import { FolderView } from '@/app/(protected)/vault/folders/[folderId]/client'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'

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

  // Fetch folder data
  const folder = await getFolderWithContents(folderId, session.user.id)

  if (!folder) notFound()

  // Create a query client and seed it with SSR data
  const queryClient = new QueryClient()
  
  // Define query keys inline (can't import client-side hooks in server components)
  const folderQueryKey = ['vault', 'folders', folderId]
  const projectsQueryKey = ['vault', 'projects']
  
  // Seed the folder query cache
  queryClient.setQueryData(folderQueryKey, folder)
  
  // Seed individual project query caches for immediate availability
  folder.projects.forEach((project) => {
    queryClient.setQueryData([...projectsQueryKey, project.id], project)
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FolderView folder={folder} />
    </HydrationBoundary>
  )
} 