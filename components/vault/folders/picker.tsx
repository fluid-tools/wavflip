'use client'

import { useState } from 'react'
import { useVaultTree } from '@/hooks/data/use-vault'
import { Folder, ChevronRight, ChevronDown, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface HierarchicalFolder {
  id: string
  name: string
  parentFolderId: string | null
  projects: Array<{
    id: string
    name: string
    trackCount: number
  }>
  subfolders: HierarchicalFolder[]
  projectCount: number
  subFolderCount: number
  level: number
}

interface FolderNode extends HierarchicalFolder {
  isExpanded?: boolean
}

interface FolderPickerProps {
  selectedFolderId: string | null
  onFolderSelect: (folderId: string | null) => void
  excludeFolderId?: string // Folder to exclude from selection (e.g., the item being moved)
  allowVaultSelection?: boolean // Whether to allow selecting vault (root) as destination
  className?: string
}

export function FolderPicker({
  selectedFolderId,
  onFolderSelect,
  excludeFolderId,
  allowVaultSelection = true,
  className,
}: FolderPickerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  // Fetch hierarchical folders from server
  const { data: foldersData, isLoading } = useVaultTree({ levels: true, excludeId: excludeFolderId })

  const hierarchicalFolders = (foldersData?.folders || []).map(f => ({
    ...f,
    level: typeof f.level === 'number' ? f.level : 0,
  })) as HierarchicalFolder[]

  // Flatten hierarchical folders into a displayable list
  const flattenFolders = (folders: HierarchicalFolder[]): FolderNode[] => {
    const result: FolderNode[] = []
    
    const traverse = (folderList: HierarchicalFolder[]) => {
      for (const folder of folderList) {
        result.push({
          ...folder,
          isExpanded: expandedFolders.has(folder.id)
        })
        
        if (expandedFolders.has(folder.id) && folder.subfolders.length > 0) {
          traverse(folder.subfolders)
        }
      }
    }
    
    traverse(folders)
    return result
  }

  const folderTree = flattenFolders(hierarchicalFolders)

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const hasSubfolders = (folder: HierarchicalFolder) => {
    return folder.subfolders.length > 0
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Vault option */}
      {allowVaultSelection && (
        <Button
          variant={selectedFolderId === null ? "default" : "ghost"}
          className="w-full justify-start h-auto p-3"
          onClick={() => onFolderSelect(null)}
        >
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span className="font-medium">Vault (Root)</span>
          </div>
        </Button>
      )}

      {/* Folder tree */}
      <ScrollArea className="h-64 border rounded-md">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading folders...
            </div>
          ) : (
            folderTree.map((folder) => (
            <div key={folder.id} className="space-y-1">
              <div className="flex items-center w-full">
                <div 
                  className="flex items-center"
                  style={{ paddingLeft: `${folder.level * 16}px` }}
                >
                  {/* Expand/collapse button for folders with subfolders */}
                  {hasSubfolders(folder) ? (
                    <button
                      type="button"
                      className="p-1 h-6 w-6 hover:bg-muted rounded flex items-center justify-center flex-shrink-0"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleFolder(folder.id)
                      }}
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
                  type="button"
                  variant={selectedFolderId === folder.id ? "default" : "ghost"}
                  className="flex-1 justify-start h-auto p-2 ml-1"
                  onClick={() => onFolderSelect(folder.id)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="truncate text-left flex-1">{folder.name}</span>
                    
                    {/* Project count indicator */}
                    <span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5 flex-shrink-0">
                      {folder.projects?.length || 0}
                    </span>
                  </div>
                </Button>
              </div>
            </div>
            ))
          )}
          
          {!isLoading && folderTree.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No folders available
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
} 