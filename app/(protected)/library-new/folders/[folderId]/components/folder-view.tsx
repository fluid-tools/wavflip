'use client'

import { useMemo } from 'react'
import { Folder } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { FolderWithProjects } from '@/db/schema/library'
import { CreateProjectDialog } from '../../../components/create-project-dialog'
import { FolderCard } from '../../../components/folder-card'
import { ProjectCard } from '../../../components/project-card'
import { Virtuoso } from 'react-virtuoso'

interface FolderViewProps {
  folder: FolderWithProjects
}

type FolderItem = 
  | { type: 'folder'; data: NonNullable<FolderWithProjects['subFolders']>[number] }
  | { type: 'project'; data: FolderWithProjects['projects'][number] }

export function FolderView({ folder }: FolderViewProps) {
  // Combine subfolders and projects into a single array for virtualization
  const folderItems = useMemo((): FolderItem[] => {
    const items: FolderItem[] = [
      ...(folder.subFolders || []).map(subFolder => ({ type: 'folder' as const, data: subFolder })),
      ...folder.projects.map(project => ({ type: 'project' as const, data: project }))
    ]
    return items
  }, [folder.subFolders, folder.projects])

  // Calculate grid columns based on screen size
  const ITEMS_PER_ROW = 4

  const renderItem = (index: number) => {
    const item = folderItems[index]
    if (!item) return null

    if (item.type === 'folder') {
      return (
        <FolderCard 
          key={item.data.id} 
          folder={{ ...item.data, projects: [] }} 
          showProjectCount={false} 
        />
      )
    } else {
      return (
        <ProjectCard 
          key={item.data.id} 
          project={item.data} 
          folderId={folder.id}
          trackCount={item.data.trackCount}
        />
      )
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Folder Info */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{folder.name}</h1>
        <p className="text-muted-foreground">
          {folder.subFolders?.length || 0} {(folder.subFolders?.length || 0) === 1 ? 'folder' : 'folders'}, {folder.projects.length} {folder.projects.length === 1 ? 'project' : 'projects'}
        </p>
      </div>

      {/* Folders and Projects Grid */}
      {folderItems.length > 0 ? (
        <div style={{ height: '600px' }}>
          <Virtuoso
            style={{ height: '100%' }}
            totalCount={Math.ceil(folderItems.length / ITEMS_PER_ROW)}
            itemContent={(rowIndex) => (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                {Array.from({ length: ITEMS_PER_ROW }, (_, colIndex) => {
                  const itemIndex = rowIndex * ITEMS_PER_ROW + colIndex
                  return itemIndex < folderItems.length ? (
                    <div key={itemIndex}>
                      {renderItem(itemIndex)}
                    </div>
                  ) : null
                })}
              </div>
            )}
          />
        </div>
      ) : (
        /* Empty state */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Empty folder</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create folders or projects to organize your content
            </p>
            <CreateProjectDialog folderId={folder.id} triggerText="Create Project" />
          </CardContent>
        </Card>
      )}
    </div>
  )
} 