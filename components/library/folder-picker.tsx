'use client'

import { useState, useEffect } from 'react'
import { Folder, ChevronRight, ChevronDown, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { FolderWithProjects } from '@/db/schema/library'

interface FolderNode extends FolderWithProjects {
  isExpanded?: boolean
  level: number
}

interface FolderPickerProps {
  folders: FolderWithProjects[]
  selectedFolderId: string | null
  onFolderSelect: (folderId: string | null) => void
  excludeFolderId?: string // Folder to exclude from selection (e.g., the item being moved)
  allowVaultSelection?: boolean // Whether to allow selecting vault (root) as destination
  className?: string
}

export function FolderPicker({
  folders,
  selectedFolderId,
  onFolderSelect,
  excludeFolderId,
  allowVaultSelection = true,
  className,
}: FolderPickerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [folderTree, setFolderTree] = useState<FolderNode[]>([])

  // Build hierarchical folder structure with levels
  useEffect(() => {
    const buildTree = (parentId: string | null = null, level: number = 0): FolderNode[] => {
      return folders
        .filter(folder => folder.parentFolderId === parentId && folder.id !== excludeFolderId)
        .map(folder => ({
          ...folder,
          level,
          isExpanded: expandedFolders.has(folder.id),
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    }

    const getAllFolders = (parentId: string | null = null, level: number = 0): FolderNode[] => {
      const currentLevel = buildTree(parentId, level)
      const result: FolderNode[] = []

      for (const folder of currentLevel) {
        result.push(folder)
        if (expandedFolders.has(folder.id)) {
          result.push(...getAllFolders(folder.id, level + 1))
        }
      }

      return result
    }

    setFolderTree(getAllFolders())
  }, [folders, expandedFolders, excludeFolderId])

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const hasSubfolders = (folderId: string) => {
    return folders.some(folder => folder.parentFolderId === folderId && folder.id !== excludeFolderId)
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
          {folderTree.map((folder) => (
            <div key={folder.id} className="space-y-1">
              <Button
                variant={selectedFolderId === folder.id ? "default" : "ghost"}
                className="w-full justify-start h-auto p-2"
                onClick={() => onFolderSelect(folder.id)}
              >
                <div 
                  className="flex items-center gap-1 w-full"
                  style={{ paddingLeft: `${folder.level * 16}px` }}
                >
                  {/* Expand/collapse button for folders with subfolders */}
                  {hasSubfolders(folder.id) ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-4 w-4 hover:bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFolder(folder.id)
                      }}
                    >
                      {folder.isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </Button>
                  ) : (
                    <div className="w-4" />
                  )}
                  
                  <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span className="truncate text-left flex-1">{folder.name}</span>
                  
                  {/* Project count indicator */}
                  <span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5 flex-shrink-0">
                    {folder.projects?.length || 0}
                  </span>
                </div>
              </Button>
            </div>
          ))}
          
          {folderTree.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No folders available
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
} 