import { getVaultData } from '@/lib/server/vault/data'
import { VaultView } from '@/app/(protected)/vault/client'
import { VaultStats } from '@/components/vault/stats-cards'
import { requireAuth } from '@/lib/server/auth'

export default async function VaultPage() {
  const session = await requireAuth()
  
  // Only fetch page-specific data (common vault data is handled by layout)
  const vaultData = await getVaultData(session.user.id, { 
    includeStats: true, 
    includeHierarchy: false 
  })

  return (
    <div className="w-full p-6 space-y-6">
      <VaultStats stats={vaultData.stats!} />
      <VaultView />
    </div>
  )
} 