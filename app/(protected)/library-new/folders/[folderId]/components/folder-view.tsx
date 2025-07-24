'use client'

import { Music, Folder } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { FolderWithProjects } from '@/db/schema/library'
import { CreateProjectDialog } from '../../../components/create-project-dialog'
import { FolderCard } from '../../../components/folder-card'
import { ProjectCard } from '../../../components/project-card'

interface FolderViewProps {
  folder: FolderWithProjects
}

export function FolderView({ folder }: FolderViewProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Folder Info */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{folder.name}</h1>
        <p className="text-muted-foreground">
          {folder.subFolders?.length || 0} {(folder.subFolders?.length || 0) === 1 ? 'folder' : 'folders'}, {folder.projects.length} {folder.projects.length === 1 ? 'project' : 'projects'}
        </p>
      </div>

      {/* Folders and Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Subfolders */}
        {folder.subFolders?.map((subFolder) => (
          <FolderCard 
            key={subFolder.id} 
            folder={{ ...subFolder, projects: [] }} 
            showProjectCount={false} 
          />
        ))}

        {/* Projects */}
        {folder.projects.map((project) => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            folderId={folder.id}
            trackCount={project.trackCount}
          />
        ))}

        {/* Empty state */}
        {(folder.subFolders?.length || 0) === 0 && folder.projects.length === 0 && (
          <div className="col-span-full">
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Folder className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Empty folder</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create folders or projects to organize your content
                </p>
                <CreateProjectDialog folderId={folder.id} triggerText="Create Project" />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 