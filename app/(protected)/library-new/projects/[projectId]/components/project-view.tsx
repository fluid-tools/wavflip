'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Music, ChevronRight, Play, Clock, HardDrive, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getProjectWithTracks } from '@/lib/library-db'
import type { ProjectWithTracks } from '@/db/schema/library'
import Link from 'next/link'

interface ProjectViewProps {
  projectId: string
  userId: string
}

export function ProjectView({ projectId, userId }: ProjectViewProps) {
  const [project, setProject] = useState<ProjectWithTracks | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadProject() {
      try {
        const projectData = await getProjectWithTracks(projectId, userId)
        setProject(projectData)
      } catch (error) {
        console.error('Failed to load project:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProject()
  }, [projectId, userId])

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-20" />
                <div className="h-3 bg-muted rounded w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/library-new">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Library
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="font-semibold mb-2">Project not found</h3>
            <p className="text-sm text-muted-foreground">
              This project may have been deleted or you don&apos;t have access to it.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={project.folderId ? `/library-new/folders/${project.folderId}` : '/library-new'}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {project.folderId ? 'Back to Folder' : 'Library'}
            </Button>
          </Link>
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/library-new" className="hover:text-foreground">
              Library
            </Link>
            {project.folderId && (
              <>
                <ChevronRight className="h-3 w-3" />
                <Link href={`/library-new/folders/${project.folderId}`} className="hover:text-foreground">
                  Folder
                </Link>
              </>
            )}
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{project.name}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Track
          </Button>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Project Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          {project.accessType !== 'private' && (
            <Badge variant="secondary">{project.accessType}</Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          {project.tracks.length} {project.tracks.length === 1 ? 'track' : 'tracks'}
        </p>
      </div>

      {/* Tracks List */}
      {project.tracks.length > 0 ? (
        <div className="space-y-4">
          {project.tracks.map((track) => (
            <Card key={track.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                    <Play className="h-4 w-4" />
                  </Button>
                  
                  <div className="h-10 w-16 bg-muted rounded flex items-center justify-center">
                    <Music className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{track.name}</h3>
                      <span className="text-xs text-muted-foreground">v{track.activeVersion?.version || 1}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(track.activeVersion?.duration || 0)}
                      </div>
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {formatBytes(track.activeVersion?.size || 0)}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {track.activeVersion?.mimeType?.split('/')[1]?.toUpperCase() || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Music className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No tracks yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your first track to get started
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Track
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 