"use client"

import { usePathname } from 'next/navigation'
import React from 'react'
import { useVaultSidebar } from '@/hooks/use-vault'
import Link from "next/link"
import { 
  FolderOpen, 
  Folder, 
  Music, 
  ChevronDown, 
  ChevronRight,
  Plus,
  FolderPlus
} from 'lucide-react'
import { useState } from 'react'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarMenuAction,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateFolderDialog } from '@/components/vault/folders/create-dialog'
import { CreateProjectDialog } from '@/components/vault/projects/create-dialog'

interface SidebarFolder {
  id: string
  name: string
  parentFolderId: string | null
  projects: Array<{
    id: string
    name: string
    trackCount: number
  }>
  subfolders: SidebarFolder[]
  projectCount: number
  subFolderCount: number
}



export function VaultSidebarNavigation() {
  const pathname = usePathname()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false)

  // Use the new vault hooks
  const { data: libraryData, isLoading } = useVaultSidebar()

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const renderFolder = (folder: SidebarFolder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const isActive = pathname === `/vault/folders/${folder.id}`
    const hasSubItems = (folder.subfolders && folder.subfolders.length > 0) || folder.projects.length > 0

    const shouldShowSubItems = hasSubItems

    return (
      <div key={folder.id}>
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={isActive}>
            <Link href={`/vault/folders/${folder.id}`}>
              <Folder className="h-4 w-4" />
              <span>{folder.name}</span>
            </Link>
          </SidebarMenuButton>
          
          {shouldShowSubItems && (
            <SidebarMenuAction onClick={() => toggleFolder(folder.id)}>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </SidebarMenuAction>
          )}
        </SidebarMenuItem>
        
        {shouldShowSubItems && isExpanded && (
          <SidebarMenuSub>
            {/* Render real projects in this folder */}
            {folder.projects.map((project) => (
              <SidebarMenuSubItem key={project.id}>
                <SidebarMenuSubButton 
                  asChild 
                  isActive={pathname === `/vault/projects/${project.id}`}
                >
                  <Link href={`/vault/projects/${project.id}`}>
                    <Music className="h-4 w-4" />
                    <span>{project.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {project.trackCount}
                    </span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
            
            {/* Render real subfolders recursively */}
            {folder.subfolders.map((subfolder) => 
              renderFolder(subfolder, level + 1)
            )}
          </SidebarMenuSub>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Vault</SidebarGroupLabel>
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

  if (!libraryData) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Vault</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <FolderOpen className="h-4 w-4" />
                <span>No content yet</span>
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
        Vault
      </SidebarGroupLabel>
      
      {/* Quick create action - proper sidebar style */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarGroupAction title="Add Folder or Project">
            <Plus />
            <span className="sr-only">Add Folder or Project</span>
          </SidebarGroupAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem onClick={() => setShowCreateFolderDialog(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            Create Folder
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowCreateProjectDialog(true)}>
            <Music className="h-4 w-4 mr-2" />
            Create Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <SidebarGroupContent>
        <SidebarMenu>
          {/* Root level projects */}
          {rootProjects.map((project) => (
            <SidebarMenuItem key={project.id}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === `/vault/projects/${project.id}`}
              >
                <Link href={`/vault/projects/${project.id}`}>
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
          {folders.map((folder: SidebarFolder) => renderFolder(folder))}
          
          {/* Empty state */}
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

      {/* Dialogs triggered by dropdown */}
      <CreateFolderDialog 
        open={showCreateFolderDialog}
        onOpenChange={setShowCreateFolderDialog}
        onSuccess={() => setShowCreateFolderDialog(false)}
      />
      <CreateProjectDialog 
        open={showCreateProjectDialog}
        onOpenChange={setShowCreateProjectDialog}
        onSuccess={() => setShowCreateProjectDialog(false)}
      />
    </SidebarGroup>
  )
} 