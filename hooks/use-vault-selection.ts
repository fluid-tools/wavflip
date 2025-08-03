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
  selectItemAtom,
  selectRangeAtom,
  type VaultItem
} from '@/state/vault-selection-atoms'

export function useVaultSelection() {
  const [selectedItems, setSelectedItems] = useAtom(selectedItemsAtom)
  const [selectionMode, setSelectionMode] = useAtom(selectionModeAtom)
  const selectedCount = useAtomValue(selectedItemsCountAtom)
  const clearSelection = useSetAtom(clearSelectionAtom)
  const toggleItemSelection = useSetAtom(toggleItemSelectionAtom)
  const selectItem = useSetAtom(selectItemAtom)
  const selectRange = useSetAtom(selectRangeAtom)

  const handleItemClick = useCallback((
    itemId: string,
    event: React.MouseEvent,
    allItems: VaultItem[]
  ) => {
    // Handle selection based on modifier keys
    if (event.shiftKey) {
      event.preventDefault()
      event.stopPropagation()
      selectRange(itemId, allItems)
    } else if (event.ctrlKey || event.metaKey) {
      event.preventDefault()
      event.stopPropagation()
      toggleItemSelection(itemId)
    } else if (selectedItems.has(itemId)) {
      // If item is already selected and no modifiers, unselect it
      event.preventDefault()
      event.stopPropagation()
      toggleItemSelection(itemId)
    }
    // For normal clicks on unselected items, let the default navigation happen
  }, [selectRange, toggleItemSelection, selectedItems])

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
    isItemSelected,
    handleItemClick,
    handleKeyDown,
    clearSelection,
    toggleItemSelection,
    selectItem,
    selectRange
  }
}

export function useItemSelection(itemId: string) {
  const isSelected = useAtomValue(isItemSelectedAtom(itemId))
  return isSelected
}