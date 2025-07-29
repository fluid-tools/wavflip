"use client"

import { useState, useActionState, useEffect } from 'react'
import { Plus, Folder, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createFolderAction, createProjectAction } from '@/actions/library'
import { toast } from 'sonner'
import {
  SidebarGroupAction,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

interface SidebarCreateActionsProps {
  onSuccess?: () => void
}

export function SidebarCreateActions({ onSuccess }: SidebarCreateActionsProps) {
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [projectName, setProjectName] = useState('')

  const [folderState, folderFormAction] = useActionState(
    createFolderAction,
    { success: false, error: null }
  )

  const [projectState, projectFormAction] = useActionState(
    createProjectAction,
    { success: false, error: null }
  )

  // Handle folder creation success/error
  useEffect(() => {
    if (folderState.success) {
      toast.success('Folder created successfully')
      setFolderDialogOpen(false)
      setFolderName('')
      onSuccess?.()
    } else if (folderState.error) {
      toast.error(folderState.error)
    }
  }, [folderState, onSuccess])

  // Handle project creation success/error
  useEffect(() => {
    if (projectState.success) {
      toast.success('Project created successfully')
      setProjectDialogOpen(false)
      setProjectName('')
      onSuccess?.()
    } else if (projectState.error) {
      toast.error(projectState.error)
    }
  }, [projectState, onSuccess])

  return (
    <div className="flex gap-1 p-2 group-data-[collapsible=icon]:hidden">
      {/* Create Folder Dialog */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="flex-1">
            <Folder className="h-4 w-4" />
            <span className="ml-2">New Folder</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder in your library root.
            </DialogDescription>
          </DialogHeader>
          <form action={folderFormAction}>
            <input type="hidden" name="parentFolderId" value="" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input
                  id="folder-name"
                  name="name"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setFolderDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Folder</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Project Dialog */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="flex-1">
            <Music className="h-4 w-4" />
            <span className="ml-2">New Project</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project in your library root.
            </DialogDescription>
          </DialogHeader>
          <form action={projectFormAction}>
            <input type="hidden" name="folderId" value="" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  name="name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setProjectDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Project</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 