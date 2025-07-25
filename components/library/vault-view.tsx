'use client'

import { useMemo } from 'react'
import { Folder, Music } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FolderWithProjects, ProjectWithTrackCount } from '@/db/schema/library'
import { CreateFolderDialog } from './dialogs/create-folder-dialog'
import { CreateProjectDialog } from './dialogs/create-project-dialog'
import { FolderCard } from '../../app/(protected)/library-new/components/folder-card'
import { ProjectCard } from './project-card'
import { Virtuoso } from 'react-virtuoso'

interface LibraryStats {
  totalFolders: number
  totalProjects: number
  totalTracks: number
  totalVersions: number
  totalSize: number
  totalDuration: number
}

interface VaultViewProps {
  initialFolders: FolderWithProjects[]
  initialProjects: ProjectWithTrackCount[]
  initialStats: LibraryStats
}

type LibraryItem = 
  | { type: 'folder'; data: FolderWithProjects }
  | { type: 'project'; data: ProjectWithTrackCount }

export function VaultView({ initialFolders, initialProjects, initialStats }: VaultViewProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Combine folders and projects into a single array for virtualization
  const libraryItems = useMemo((): LibraryItem[] => {
    const items: LibraryItem[] = [
      ...initialFolders.map(folder => ({ type: 'folder' as const, data: folder })),
      ...initialProjects.map(project => ({ type: 'project' as const, data: project }))
    ]
    return items
  }, [initialFolders, initialProjects])

  // Calculate grid columns based on screen size
  const ITEMS_PER_ROW = 4

  const renderItem = (index: number) => {
    const item = libraryItems[index]
    if (!item) return null

    if (item.type === 'folder') {
      return <FolderCard key={item.data.id} folder={item.data} />
    } else {
      return (
        <ProjectCard 
          key={item.data.id} 
          project={item.data} 
          trackCount={item.data.trackCount}
        />
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Folders</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialStats.totalFolders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialStats.totalProjects}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tracks</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialStats.totalTracks}</div>
            <p className="text-xs text-muted-foreground">
              {initialStats.totalVersions} versions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(initialStats.totalSize)}</div>
            <p className="text-xs text-muted-foreground">
              {formatDuration(initialStats.totalDuration)} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Library Contents</h2>
          <div className="flex gap-2">
            <CreateFolderDialog />
            <CreateProjectDialog />
          </div>
        </div>

        {libraryItems.length > 0 ? (
          <div style={{ height: '600px' }}>
            <Virtuoso
              style={{ height: '100%' }}
              totalCount={Math.ceil(libraryItems.length / ITEMS_PER_ROW)}
              itemContent={(rowIndex) => (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                  {Array.from({ length: ITEMS_PER_ROW }, (_, colIndex) => {
                    const itemIndex = rowIndex * ITEMS_PER_ROW + colIndex
                    return itemIndex < libraryItems.length ? (
                      <div key={itemIndex}>
                        {renderItem(itemIndex)}
                      </div>
                    ) : null
                  })}
                </div>
              )}
            />
          </div>
        ) : (
          /* Empty state */
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Folder className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No folders or projects yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start organizing your tracks by creating folders and projects
              </p>
              <div className="flex gap-2">
                <CreateFolderDialog />
                <CreateProjectDialog triggerText="Create Project" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 