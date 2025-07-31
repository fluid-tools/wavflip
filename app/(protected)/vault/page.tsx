import { requireAuth } from '@/lib/server/auth'
import { getVaultData } from '@/lib/server/vault/data'
import { getUserFolders, getVaultProjects } from '@/lib/server/vault'
import { VaultView } from '@/app/(protected)/vault/client'
import { VaultStats } from '@/components/vault/stats-cards'

export default async function VaultPage() {
  const session = await requireAuth()
  
  // Fetch data using unified approach
  const [vaultData, folders, projects] = await Promise.all([
    getVaultData(session.user.id, { includeStats: true, includeHierarchy: false }),
    getUserFolders(session.user.id), // For VaultView format
    getVaultProjects(session.user.id) // For VaultView format
  ])

  return (
    <div className="w-full p-6 space-y-6">
      <VaultStats stats={vaultData.stats!} />
      <VaultView 
        initialFolders={folders}
        initialProjects={projects}
      />
    </div>
  )
} 