'use client'

import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useCallback } from 'react'
import {
  selectedItemsAtom,
  selectionModeAtom,
  selectedItemsCountAtom,
  isItemSelectedAtom,
  clearSelectionAtom,
  toggleItemSelectionAtom,
  selectRangeAtom,
  isSelectModeActiveAtom,
  type VaultItem
} from '@/state/vault-selection-atoms'

export function useVaultSelection() {
  const [selectedItems, setSelectedItems] = useAtom(selectedItemsAtom)
  const [selectionMode, setSelectionMode] = useAtom(selectionModeAtom)
  const isSelectModeActive = useAtomValue(isSelectModeActiveAtom)
  const selectedCount = useAtomValue(selectedItemsCountAtom)
  const clearSelection = useSetAtom(clearSelectionAtom)
  const toggleItemSelection = useSetAtom(toggleItemSelectionAtom)
  const selectRange = useSetAtom(selectRangeAtom)

  const handleItemClick = useCallback((
    itemId: string,
    event: React.MouseEvent,
    allItems: VaultItem[]
  ) => {
    // Only run selection logic if we're in selection mode OR using modifier keys
    if (isSelectModeActive || event.shiftKey || event.ctrlKey || event.metaKey) {
      event.preventDefault()
      event.stopPropagation()
      
      if (event.shiftKey) {
        // Shift-click: range selection
        selectRange(itemId, allItems)
      } else if (event.ctrlKey || event.metaKey) {
        // Cmd/Ctrl-click: toggle selection
        toggleItemSelection(itemId)
      } else {
        // Regular click in selection mode: toggle selection
        toggleItemSelection(itemId)
      }
    }
    // Otherwise, let normal navigation happen (don't prevent default)
  }, [isSelectModeActive, toggleItemSelection, selectRange])

  const isItemSelected = useCallback((itemId: string) => {
    return selectedItems.has(itemId)
  }, [selectedItems])

  const handleKeyDown = useCallback((
    event: KeyboardEvent, 
    allItems: VaultItem[],
    onCreateFolderWithSelection?: () => void,
    onBulkDelete?: () => void
  ) => {
    if (event.key === 'Escape') {
      clearSelection()
    } else if (event.key === 'a' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      const allIds = new Set(allItems.map(item => item.id))
      setSelectedItems(allIds)
      setSelectionMode(true)
    } else if ((event.key === 'Delete' || event.key === 'Backspace') && selectedItems.size > 0) {
      event.preventDefault()
      onBulkDelete?.()
    } else if (event.key === 'n' && event.shiftKey && selectedItems.size > 0) {
      event.preventDefault()
      onCreateFolderWithSelection?.()
    }
  }, [clearSelection, setSelectedItems, setSelectionMode, selectedItems])

  return {
    selectedItems: Array.from(selectedItems),
    selectedCount,
    selectionMode,
    isSelectModeActive,
    isItemSelected,
    handleItemClick,
    handleKeyDown,
    clearSelection,
    toggleItemSelection,
    selectRange
  }
}

export function useItemSelection(itemId: string) {
  const isSelected = useAtomValue(isItemSelectedAtom(itemId))
  return isSelected
}