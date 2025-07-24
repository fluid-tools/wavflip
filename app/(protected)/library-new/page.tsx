import { requireAuth } from '@/lib/auth-server'
import { getUserFolders, getVaultProjects, getLibraryStats } from '@/lib/library-db'
import { VaultView } from './components/vault-view'

export default async function LibraryNewPage() {
  const session = await requireAuth()
  
  // Fetch all data server-side
  const [folders, projects, stats] = await Promise.all([
    getUserFolders(session.user.id),
    getVaultProjects(session.user.id),
    getLibraryStats(session.user.id)
  ])

  return (
    <div className="p-6">
      <VaultView 
        initialFolders={folders}
        initialProjects={projects}
        initialStats={stats}
      />
    </div>
  )
} 