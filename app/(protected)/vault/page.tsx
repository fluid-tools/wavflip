import { getVaultData } from '@/lib/server/vault/data'
import { VaultView } from '@/app/(protected)/vault/client'
import { VaultStats } from '@/components/vault/stats-cards'
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

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="w-full p-6 space-y-6">
        <VaultStats />
        <VaultView />
      </div>
    </HydrationBoundary>
  )
} 