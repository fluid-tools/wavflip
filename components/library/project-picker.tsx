'use client'

import { useState, useEffect } from 'react'
import { Music, ChevronRight, ChevronDown, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { ProjectWithTracks } from '@/db/schema/library'

interface ProjectPickerProps {
  projects: ProjectWithTracks[]
  selectedProjectId: string | null
  onProjectSelect: (projectId: string) => void
  excludeProjectId?: string // Project to exclude from selection (e.g., current project)
  className?: string
}

export function ProjectPicker({
  projects,
  selectedProjectId,
  onProjectSelect,
  excludeProjectId,
  className,
}: ProjectPickerProps) {
  const filteredProjects = projects.filter(project => project.id !== excludeProjectId)

  return (
    <div className={cn("space-y-2", className)}>
      <ScrollArea className="h-64 border rounded-md">
        <div className="p-2 space-y-1">
          {filteredProjects.map((project) => (
            <Button
              key={project.id}
              variant={selectedProjectId === project.id ? "default" : "ghost"}
              className="w-full justify-start h-auto p-3"
              onClick={() => onProjectSelect(project.id)}
            >
              <div className="flex items-center gap-2 w-full">
                <Music className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="truncate text-left flex-1">{project.name}</span>
                
                {/* Track count indicator */}
                <span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5 flex-shrink-0">
                  {project.trackCount || 0} {(project.trackCount || 0) === 1 ? 'track' : 'tracks'}
                </span>
              </div>
            </Button>
          ))}
          
          {filteredProjects.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No other projects available
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
} 