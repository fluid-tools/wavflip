import { requireAuth } from '@/lib/auth-server'
import { getUserFolders, getVaultProjects, getLibraryStats } from '@/server/library'
import { VaultView } from '@/components/library/vault/view'

export default async function LibraryNewPage() {
  const session = await requireAuth()
  
  // Fetch all data server-side
  const [folders, projects, stats] = await Promise.all([
    getUserFolders(session.user.id), // For display (root level only)
    getVaultProjects(session.user.id),
    getLibraryStats(session.user.id)
  ])

  return (
    <div className="w-full h-full p-6">
      <VaultView 
        initialFolders={folders}
        initialProjects={projects}
        initialStats={stats}
      />
    </div>
  )
} 