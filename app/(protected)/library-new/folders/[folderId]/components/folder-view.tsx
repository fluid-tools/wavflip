'use client'

import { ArrowLeft, Music, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { FolderWithProjects } from '@/db/schema/library'
import Link from 'next/link'
import { CreateProjectDialog } from '../../../components/create-project-dialog'
import { ProjectCard } from '../../../components/project-card'

interface FolderViewProps {
  folder: FolderWithProjects
}

export function FolderView({ folder }: FolderViewProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/library-new">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Library
            </Button>
          </Link>
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/library-new" className="hover:text-foreground">
              Library
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{folder.name}</span>
          </div>
        </div>
        
        <CreateProjectDialog folderId={folder.id} />
      </div>

      {/* Folder Info */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{folder.name}</h1>
        <p className="text-muted-foreground">
          {folder.projects.length} {folder.projects.length === 1 ? 'project' : 'projects'}
        </p>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {folder.projects.map((project) => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            folderId={folder.id}
            trackCount={project.trackCount}
          />
        ))}

        {/* Empty state */}
        {folder.projects.length === 0 && (
          <div className="col-span-full">
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Music className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No projects yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first project in this folder to get started
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