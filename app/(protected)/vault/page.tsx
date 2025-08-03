import { requireAuth } from '@/lib/server/auth'
import { getVaultData } from '@/lib/server/vault/data'
import { getUserFolders, getVaultProjects } from '@/lib/server/vault'
import { VaultView } from '@/app/(protected)/vault/client'
import { VaultStats } from '@/components/vault/stats-cards'
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'

export default async function VaultPage() {
  const session = await requireAuth()
  const queryClient = new QueryClient()
  
  // Prefetch data for hydration
  const [vaultData] = await Promise.all([
    getVaultData(session.user.id, { includeStats: true, includeHierarchy: false }),
    queryClient.prefetchQuery({
      queryKey: ['vault', 'folders'],
      queryFn: () => getUserFolders(session.user.id)
    }),
    queryClient.prefetchQuery({
      queryKey: ['vault', 'vault-projects'],
      queryFn: () => getVaultProjects(session.user.id)
    })
  ])

  return (
    <div className="w-full p-6 space-y-6">
      <VaultStats stats={vaultData.stats!} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <VaultView />
      </HydrationBoundary>
    </div>
  )
} 