'use client';

import { Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ProjectWithTracks } from '@/lib/contracts/project';
import { cn } from '@/lib/utils';

type ProjectPickerProps = {
  projects: ProjectWithTracks[];
  selectedProjectId: string | null;
  onProjectSelect: (projectId: string) => void;
  excludeProjectId?: string; // Project to exclude from selection (e.g., current project)
  className?: string;
};

export function ProjectPicker({
  projects,
  selectedProjectId,
  onProjectSelect,
  excludeProjectId,
  className,
}: ProjectPickerProps) {
  const filteredProjects = projects.filter(
    (project) => project.id !== excludeProjectId
  );

  return (
    <div className={cn('space-y-2', className)}>
      <ScrollArea className="h-64 rounded-md border">
        <div className="space-y-1 p-2">
          {filteredProjects.map((project) => (
            <Button
              className="h-auto w-full justify-start p-3"
              key={project.id}
              onClick={() => onProjectSelect(project.id)}
              variant={selectedProjectId === project.id ? 'default' : 'ghost'}
            >
              <div className="flex w-full items-center gap-2">
                <Music className="h-4 w-4 flex-shrink-0 text-green-500" />
                <span className="flex-1 truncate text-left">
                  {project.name}
                </span>

                {/* Track count indicator */}
                <span className="flex-shrink-0 rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
                  {project.trackCount || 0}{' '}
                  {(project.trackCount || 0) === 1 ? 'track' : 'tracks'}
                </span>
              </div>
            </Button>
          ))}

          {filteredProjects.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              No other projects available
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
