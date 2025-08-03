'use client'

import { useState, startTransition } from 'react'
import { FolderPlus, Trash2, X, Move } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useVaultSelection } from '@/hooks/use-vault-selection'
import { CreateFolderDialog } from '@/components/vault/folders/create-dialog'
import { FolderPicker } from '@/components/vault/folders/picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDeleteFolderAction, useDeleteProjectAction, useMoveFolderAction, useMoveProjectAction } from '@/actions/use-vault-action'
import { SelectionModeToggle } from '@/components/vault/selection-mode-toggle'

interface BulkActionsToolbarProps {
  vaultItems: Array<{ id: string; type: 'folder' | 'project'; name: string }>
  parentFolderId?: string | null
}

export function BulkActionsToolbar({ vaultItems, parentFolderId = null }: BulkActionsToolbarProps) {
  const { selectedItems, selectedCount, clearSelection, touchSelectionMode } = useVaultSelection()
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null)
  
  const [, deleteFolderAction] = useDeleteFolderAction()
  const [, deleteProjectAction] = useDeleteProjectAction()
  const [, moveFolderAction] = useMoveFolderAction()
  const [, moveProjectAction] = useMoveProjectAction()

  // Show selection mode toggle when no items are selected but in touch selection mode
  if (selectedCount === 0 && !touchSelectionMode) return null

  const selectedItemsData = vaultItems.filter(item => selectedItems.includes(item.id))
  const folderCount = selectedItemsData.filter(item => item.type === 'folder').length
  const projectCount = selectedItemsData.filter(item => item.type === 'project').length

  const handleCreateFolderWithSelection = () => {
    setShowCreateFolderDialog(true)
  }

  const handleBulkMove = () => {
    setSelectedDestinationId(null)
    setShowMoveDialog(true)
  }

  const handleBulkDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmBulkDelete = async () => {
    startTransition(() => {
      for (const item of selectedItemsData) {
        const formData = new FormData()
        
        if (item.type === 'folder') {
          formData.append('folderId', item.id)
          deleteFolderAction(formData)
        } else {
          formData.append('projectId', item.id)
          deleteProjectAction(formData)
        }
      }
    })
    
    setShowDeleteDialog(false)
    clearSelection() // This will clear both selection and selection mode
  }

  const confirmBulkMove = async () => {
    if (!selectedDestinationId) return

    startTransition(() => {
      for (const item of selectedItemsData) {
        const formData = new FormData()
        
        if (item.type === 'folder') {
          formData.append('folderId', item.id)
          formData.append('parentFolderId', selectedDestinationId)
          formData.append('sourceParentFolderId', parentFolderId || '')
          moveFolderAction(formData)
        } else {
          formData.append('projectId', item.id)
          formData.append('folderId', selectedDestinationId)
          formData.append('sourceFolderId', parentFolderId || '')
          moveProjectAction(formData)
        }
      }
    })
    
    setShowMoveDialog(false)
    clearSelection() // This will clear both selection and selection mode
  }

  const getSelectionText = () => {
    if (folderCount > 0 && projectCount > 0) {
      return `${folderCount} folder${folderCount !== 1 ? 's' : ''}, ${projectCount} project${projectCount !== 1 ? 's' : ''} selected`
    } else if (folderCount > 0) {
      return `${folderCount} folder${folderCount !== 1 ? 's' : ''} selected`
    } else {
      return `${projectCount} project${projectCount !== 1 ? 's' : ''} selected`
    }
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <Card className="bg-background border shadow-lg p-4">
          <div className="flex items-center gap-4">
            {selectedCount > 0 ? (
              <>
                <span className="text-sm font-medium">{getSelectionText()}</span>
                
                <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCreateFolderWithSelection}
                className="h-8"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Create Folder
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkMove}
                className="h-8"
              >
                <Move className="h-4 w-4 mr-2" />
                Move to...
              </Button>
              
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                className="h-8"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={clearSelection}
                className="h-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
              </>
            ) : (
              <SelectionModeToggle />
            )}
          </div>
        </Card>
      </div>

      {/* Create Folder Dialog */}
      <CreateFolderDialog 
        parentFolderId={parentFolderId}
        open={showCreateFolderDialog}
        onOpenChange={setShowCreateFolderDialog}
        selectedItems={selectedItemsData}
        onSuccess={() => {
          setShowCreateFolderDialog(false)
          clearSelection()
        }}
      />

      {/* Move Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Items</DialogTitle>
            <DialogDescription>
              Select a destination folder for the selected items.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <FolderPicker
              selectedFolderId={selectedDestinationId}
              onFolderSelect={setSelectedDestinationId}
              excludeFolderId={selectedItemsData
                .filter(item => item.type === 'folder')
                .map(item => item.id)[0] // Only exclude first folder for now
              }
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmBulkMove}
              disabled={!selectedDestinationId}
            >
              Move Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Items</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the selected items? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-2">
              {selectedItemsData.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  {item.type === 'folder' ? (
                    <FolderPlus className="h-4 w-4" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBulkDelete}>
              Delete Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}