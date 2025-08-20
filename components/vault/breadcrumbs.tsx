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

  // Parse the current route for vault breadcrumbs
  const isRoot = pathname === '/vault';
  const isFolder =
    pathname.startsWith('/vault/folders/') && pathname.split('/').length >= 4;
  const isProject =
    pathname.startsWith('/vault/projects/') && pathname.split('/').length >= 4;

  // Extract IDs from pathname
  const folderId = isFolder ? pathname.split('/')[3] : null;
  const projectId = isProject ? pathname.split('/')[3] : null;

  // Only fetch data when actually needed
  const { data: folderPathData } = useFolderPath(folderId);

  // Only fetch project data when on project page
  const { project: projectData } = useProject({
    projectId: projectId || '',
    initialData: undefined,
    enabled: isProject && !!projectId,
  });

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
    const parentFolderId = projectData?.folderId;

    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Link className="hover:text-foreground" href="/vault">
          Vault
        </Link>
        {parentFolderId && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link
              className="hover:text-foreground"
              href={`/vault/folders/${parentFolderId}`}
            >
              Folder
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-foreground">{projectName}</span>
      </div>
    );
  }

  return null;
}
