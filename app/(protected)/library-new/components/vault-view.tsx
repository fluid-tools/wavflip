'use client'

import { Folder, Music } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { FolderWithProjects, Project } from '@/db/schema/library'
import Link from 'next/link'
import { CreateFolderDialog } from './create-folder-dialog'
import { CreateProjectDialog } from './create-project-dialog'

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
  initialProjects: Project[]
  initialStats: LibraryStats
}

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Folders */}
          {initialFolders.map((folder) => (
            <Link 
              key={folder.id} 
              href={`/library-new/folders/${folder.id}`}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Folder className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm truncate">{folder.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {folder.projects.length} projects
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}

          {/* Vault Projects */}
          {initialProjects.map((project) => (
            <Link 
              key={project.id} 
              href={`/library-new/projects/${project.id}`}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <Music className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm truncate">{project.name}</CardTitle>
                      <CardDescription className="text-xs">
                        Project
                      </CardDescription>
                    </div>
                    {project.accessType !== 'private' && (
                      <Badge variant="secondary" className="text-xs">
                        {project.accessType}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}

          {/* Empty state */}
          {initialFolders.length === 0 && initialProjects.length === 0 && (
            <div className="col-span-full">
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 