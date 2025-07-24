'use client'

import { ArrowLeft, Music, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { FolderWithProjects } from '@/db/schema/library'
import Link from 'next/link'
import { CreateProjectDialog } from '../../../components/create-project-dialog'

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