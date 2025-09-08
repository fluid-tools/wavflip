'use client';

import { ChevronDown, ChevronRight, Folder, Home } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useVaultTree } from '@/hooks/data/use-vault';
import { cn } from '@/lib/utils';

type HierarchicalFolder = {
  id: string;
  name: string;
  parentFolderId: string | null;
  projects: Array<{
    id: string;
    name: string;
    trackCount: number;
  }>;
  subfolders: HierarchicalFolder[];
  projectCount: number;
  subFolderCount: number;
  level: number;
};

type FolderNode = HierarchicalFolder & {
  isExpanded?: boolean;
};

type FolderPickerProps = {
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  excludeFolderId?: string; // Folder to exclude from selection (e.g., the item being moved)
  allowVaultSelection?: boolean; // Whether to allow selecting vault (root) as destination
  className?: string;
};

export function FolderPicker({
  selectedFolderId,
  onFolderSelect,
  excludeFolderId,
  allowVaultSelection = true,
  className,
}: FolderPickerProps) {
  const FOLDER_INDENT_PX = 16;

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  // Fetch hierarchical folders from server
  const { data: foldersData, isLoading } = useVaultTree({
    levels: true,
    excludeId: excludeFolderId,
  });

  const hierarchicalFolders = (foldersData?.folders || []).map((f) => ({
    ...f,
    level: typeof f.level === 'number' ? f.level : 0,
  })) as HierarchicalFolder[];

  // Flatten hierarchical folders into a displayable list
  const flattenFolders = (folders: HierarchicalFolder[]): FolderNode[] => {
    const result: FolderNode[] = [];

    const traverse = (folderList: HierarchicalFolder[]) => {
      for (const folder of folderList) {
        result.push({
          ...folder,
          isExpanded: expandedFolders.has(folder.id),
        });

        if (expandedFolders.has(folder.id) && folder.subfolders.length > 0) {
          traverse(folder.subfolders);
        }
      }
    };

    traverse(folders);
    return result;
  };

  const folderTree = flattenFolders(hierarchicalFolders);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const hasSubfolders = (folder: HierarchicalFolder) => {
    return folder.subfolders.length > 0;
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Vault option */}
      {allowVaultSelection && (
        <Button
          className="h-auto w-full justify-start p-3"
          onClick={() => onFolderSelect(null)}
          variant={selectedFolderId === null ? 'default' : 'ghost'}
        >
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span className="font-medium">Vault (Root)</span>
          </div>
        </Button>
      )}

      {/* Folder tree */}
      <ScrollArea className="h-64 rounded-md border">
        <div className="space-y-1 p-2">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading folders...
            </div>
          ) : (
            folderTree.map((folder) => (
              <div className="space-y-1" key={folder.id}>
                <div className="flex w-full items-center">
                  <div
                    className="flex items-center"
                    style={{
                      paddingLeft: `${folder.level * FOLDER_INDENT_PX}px`,
                    }}
                  >
                    {/* Expand/collapse button for folders with subfolders */}
                    {hasSubfolders(folder) ? (
                      <button
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded p-1 hover:bg-muted"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFolder(folder.id);
                        }}
                        type="button"
                      >
                        {folder.isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </button>
                    ) : (
                      <div className="w-6 flex-shrink-0" />
                    )}
                  </div>

                  <Button
                    className="ml-1 h-auto flex-1 justify-start p-2"
                    onClick={() => onFolderSelect(folder.id)}
                    type="button"
                    variant={
                      selectedFolderId === folder.id ? 'default' : 'ghost'
                    }
                  >
                    <div className="flex w-full items-center gap-2">
                      <Folder className="h-4 w-4 flex-shrink-0 text-blue-500" />
                      <span className="flex-1 truncate text-left">
                        {folder.name}
                      </span>

                      {/* Project count indicator */}
                      <span className="flex-shrink-0 rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
                        {folder.projects?.length || 0}
                      </span>
                    </div>
                  </Button>
                </div>
              </div>
            ))
          )}

          {!isLoading && folderTree.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              No folders available
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
