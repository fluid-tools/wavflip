import { getVaultData, getUserFolders } from '@/lib/server/vault'
import { getPresignedImageUrl } from '@/lib/storage/s3-storage'
import { VaultView } from '@/app/(protected)/vault/client'
import { requireAuth } from '@/lib/server/auth'
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'

export default async function VaultPage() {
  const session = await requireAuth()

  const queryClient = new QueryClient()

  // Prefetch vault stats using correct query key
  await queryClient.prefetchQuery({
    queryKey: ['vault', 'stats'],
    queryFn: async () => {
      const vaultData = await getVaultData(session.user.id, {
        includeStats: true,
        includeHierarchy: false
      })
      return vaultData.stats
    }
  })

  // Prefetch root folders for the vault view
  const folders = await getUserFolders(session.user.id)
  
  // Prefetch presigned URLs for project images in folder previews
  const projectsWithImages = folders.flatMap(folder => 
    (folder.projects || []).slice(0, 4).filter(p => p.image)
  )
  
  if (projectsWithImages.length > 0) {
    await Promise.all(
      projectsWithImages.map(project => 
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
      <VaultView />
    </HydrationBoundary>
  )
} 