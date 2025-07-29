"use client"

import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from "next/link"
import { 
  FolderOpen, 
  Folder, 
  Music, 
  ChevronDown, 
  ChevronRight,
  Plus
} from 'lucide-react'
import { useState } from 'react'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarMenuAction,
} from "@/components/ui/sidebar"
import { CreateFolderDialog } from './folders/create-dialog'
import { CreateProjectDialog } from './projects/create-dialog'

interface FolderWithProjects {
  id: string
  name: string
  parentFolderId: string | null
  projects: Array<{
    id: string
    name: string
    trackCount: number
  }>
  subfolders?: FolderWithProjects[]
}

export function LibrarySidebarNavigation() {
  const pathname = usePathname()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  // Fetch user's folders and projects for sidebar
  const { data: libraryData } = useQuery({
    queryKey: ['sidebar-library-data'],
    queryFn: async () => {
      const response = await fetch('/api/library/sidebar')
      if (!response.ok) throw new Error('Failed to fetch library data')
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const renderFolder = (folder: FolderWithProjects, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const isActive = pathname === `/library/folders/${folder.id}`
    const hasSubItems = (folder.subfolders && folder.subfolders.length > 0) || folder.projects.length > 0

    return (
      <div key={folder.id}>
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={isActive}>
            <Link href={`/library/folders/${folder.id}`}>
              <Folder className="h-4 w-4" />
              <span>{folder.name}</span>
            </Link>
          </SidebarMenuButton>
          
          {hasSubItems && (
            <SidebarMenuAction onClick={() => toggleFolder(folder.id)}>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </SidebarMenuAction>
          )}
        </SidebarMenuItem>
        
        {hasSubItems && isExpanded && (
          <SidebarMenuSub>
            {/* Render projects in this folder */}
            {folder.projects.map((project) => (
              <SidebarMenuSubItem key={project.id}>
                <SidebarMenuSubButton 
                  asChild 
                  isActive={pathname === `/library/projects/${project.id}`}
                >
                  <Link href={`/library/projects/${project.id}`}>
                    <Music className="h-4 w-4" />
                    <span>{project.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {project.trackCount}
                    </span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
            
            {/* Render subfolders - use SidebarMenuSubItem with SidebarMenuSubButton */}
            {folder.subfolders?.map((subfolder) => (
              <SidebarMenuSubItem key={subfolder.id}>
                <SidebarMenuSubButton 
                  asChild 
                  isActive={pathname === `/library/folders/${subfolder.id}`}
                >
                  <Link href={`/library/folders/${subfolder.id}`}>
                    <Folder className="h-4 w-4" />
                    <span>{subfolder.name}</span>
                  </Link>
                </SidebarMenuSubButton>
                {subfolder.subfolders && subfolder.subfolders.length > 0 && (
                  <SidebarMenuAction onClick={() => toggleFolder(subfolder.id)}>
                    {expandedFolders.has(subfolder.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </SidebarMenuAction>
                )}
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        )}
      </div>
    )
  }

  if (!libraryData) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Library</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <Folder className="h-4 w-4" />
                <span>Loading...</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  const { folders = [], rootProjects = [] } = libraryData

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
        Library
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {/* Root level projects */}
          {rootProjects.map((project: any) => (
            <SidebarMenuItem key={project.id}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === `/library/projects/${project.id}`}
              >
                <Link href={`/library/projects/${project.id}`}>
                  <Music className="h-4 w-4" />
                  <span>{project.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {project.trackCount}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          
          {/* Root level folders */}
          {folders.map((folder: FolderWithProjects) => renderFolder(folder))}
          
          {/* Empty state or quick actions */}
          {folders.length === 0 && rootProjects.length === 0 && (
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <FolderOpen className="h-4 w-4" />
                <span>No content yet</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
} 