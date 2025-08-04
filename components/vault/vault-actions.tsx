"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, FolderPlus, Music } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { CreateProjectDialog } from './projects/create-dialog'
import { CreateFolderDialog } from './folders/create-dialog'
import { SelectionModeToggle } from './selection-mode-toggle'

interface VaultActionsProps {
  folderId?: string | null
}

export function VaultActions({ folderId }: VaultActionsProps) {
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false)

  return (
    <>
      <div className="flex items-center gap-2">
        <SelectionModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
      </div>

      {/* Dialogs */}
      <CreateFolderDialog 
        parentFolderId={folderId}
        open={showCreateFolderDialog}
        onOpenChange={setShowCreateFolderDialog}
        onSuccess={() => setShowCreateFolderDialog(false)}
      />
      <CreateProjectDialog 
        folderId={folderId}
        open={showCreateProjectDialog}
        onOpenChange={setShowCreateProjectDialog}
        onSuccess={() => setShowCreateProjectDialog(false)}
      />
    </>
  )
}