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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-semibold">Library</h1>
          <p className="text-muted-foreground">
            Organize your tracks in folders and projects
          </p>
        </div>
      </div>

      <div className="flex-1 p-6">
        <VaultView 
          initialFolders={folders}
          initialProjects={projects}
          initialStats={stats}
        />
      </div>
    </div>
  )
} 