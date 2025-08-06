import { notFound } from 'next/navigation'
import { getFolderWithContents } from '@/lib/server/vault'
import { getPresignedImageUrl } from '@/lib/storage/s3-storage'
import { FolderView } from '@/app/(protected)/vault/folders/[folderId]/client'
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { requireAuth } from '@/lib/server/auth'
import type { FolderWithProjects } from '@/db/schema/vault'

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

  const folder = queryClient.getQueryData<FolderWithProjects>(['vault', 'folders', folderId])

  if (!folder) notFound()

  // Prefetch presigned URLs for project images in this folder (for preview grid)
  const projectsWithImages = folder.projects?.filter(p => p.image) || []
  
  if (projectsWithImages.length > 0) {
    // Prefetch up to 4 project images for the preview grid
    await Promise.all(
      projectsWithImages.slice(0, 4).map(project => 
        queryClient.prefetchQuery({
          queryKey: [['vault', 'projects', project.id], 'presigned-image'],
          queryFn: () => getPresignedImageUrl(project.image!),
          staleTime: 60 * 1000, // 1 minute
        })
      )
    )
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FolderView folderId={folderId} />
    </HydrationBoundary>
  )
} 