'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useFolderPath } from '@/hooks/data/use-folder';
import { useProject } from '@/hooks/data/use-project';
import type { FolderPathItem } from '@/lib/server/vault/types';

export function VaultBreadcrumbs() {
  const pathname = usePathname();
  const params = useParams();

  // Parse the current route for vault breadcrumbs
  const isRoot = pathname === '/vault';
  const isFolder = pathname.startsWith('/vault/folders/');
  const isProject = pathname.startsWith('/vault/projects/');

  // Extract IDs from Next.js params
  const folderId = isFolder ? (params.folderId as string) : null;
  const projectId = isProject ? (params.projectId as string) : null;

  // Only fetch data when actually needed
  const { data: folderPathData } = useFolderPath(folderId);

  // Get project data and its parent folder path
  const { project: projectData } = useProject({
    projectId: projectId || '',
    enabled: isProject && !!projectId,
  });
  const { data: projectFolderPathData } = useFolderPath(
    projectData?.folderId || null
  );

  if (!pathname.includes('/vault')) {
    return null;
  }

  if (isRoot) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <span className="font-medium text-foreground">Vault</span>
      </div>
    );
  }

  if (isFolder) {
    const folderPath = folderPathData?.path || [];

    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Link className="hover:text-foreground" href="/vault">
          Vault
        </Link>
        {folderPath.map((folder: FolderPathItem, index: number) => (
          <div className="flex items-center gap-2" key={folder.id}>
            <ChevronRight className="h-3 w-3" />
            {index === folderPath.length - 1 ? (
              <span className="font-medium text-foreground">{folder.name}</span>
            ) : (
              <Link
                className="hover:text-foreground"
                href={`/vault/folders/${folder.id}`}
              >
                {folder.name}
              </Link>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (isProject) {
    const projectName = projectData?.name || 'Project';
    const folderPath = projectFolderPathData?.path || [];

    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Link className="hover:text-foreground" href="/vault">
          Vault
        </Link>
        {/* Show full folder path */}
        {folderPath.map((folder: FolderPathItem, _index: number) => (
          <div className="flex items-center gap-2" key={folder.id}>
            <ChevronRight className="h-3 w-3" />
            <Link
              className="hover:text-foreground"
              href={`/vault/folders/${folder.id}`}
            >
              {folder.name}
            </Link>
          </div>
        ))}
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-foreground">{projectName}</span>
      </div>
    );
  }

  return null;
}
