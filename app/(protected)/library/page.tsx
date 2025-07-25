import { requireAuth } from '@/lib/auth-server'
import { getUserFolders, getAllUserFolders, getVaultProjects, getLibraryStats } from '@/lib/library-db'
import { VaultView } from '@/components/library/vault/view'

export default async function LibraryNewPage() {
  const session = await requireAuth()
  
  // Fetch all data server-side
  const [folders, allFolders, projects, stats] = await Promise.all([
    getUserFolders(session.user.id), // For display (root level only)
    getAllUserFolders(session.user.id), // For move dialogs (all folders)
    getVaultProjects(session.user.id),
    getLibraryStats(session.user.id)
  ])

  return (
    <div className="p-6">
      <VaultView 
        initialFolders={folders}
        initialProjects={projects}
        initialStats={stats}
        allFolders={allFolders}
      />
    </div>
  )
} 