import { requireAuth } from '@/lib/server/auth'
import { getVaultData } from '@/lib/server/vault/data'
import { getUserFolders, getVaultProjects } from '@/lib/server/vault'
import { VaultView } from '@/app/(protected)/vault/client'

export default async function VaultPage() {
  const session = await requireAuth()
  
  // Fetch data using unified approach
  const [vaultData, folders, projects] = await Promise.all([
    getVaultData(session.user.id, { includeStats: true, includeHierarchy: false }),
    getUserFolders(session.user.id), // For VaultView format
    getVaultProjects(session.user.id) // For VaultView format
  ])

  return (
    <div className="w-full h-full p-6">
      <VaultView 
        initialFolders={folders}
        initialProjects={projects}
        initialStats={vaultData.stats!}
      />
    </div>
  )
} 