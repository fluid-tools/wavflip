'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFolderPath } from '@/hooks/data/use-folder';
import { useProject } from '@/hooks/data/use-project';

type FolderPathItem = {
  id: string;
  name: string;
  parentFolderId: string | null;
};

export function VaultBreadcrumbs() {
  const pathname = usePathname();
  const MIN_PATH_SEGMENTS = 4;

  // Parse the current route for vault breadcrumbs
  const isRoot = pathname === '/vault';
  const isFolder =
    pathname.startsWith('/vault/folders/') &&
    pathname.split('/').length >= MIN_PATH_SEGMENTS;
  const isProject =
    pathname.startsWith('/vault/projects/') &&
    pathname.split('/').length >= MIN_PATH_SEGMENTS;

  // Extract IDs from pathname
  const folderId = isFolder ? pathname.split('/')[3] : null;
  const projectId = isProject ? pathname.split('/')[3] : null;

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
