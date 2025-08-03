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
    // Only handle selection if modifier keys are pressed
    if (event.shiftKey) {
      event.preventDefault()
      event.stopPropagation()
      selectRange(itemId, allItems)
    } else if (event.ctrlKey || event.metaKey) {
      event.preventDefault()
      event.stopPropagation()
      toggleItemSelection(itemId)
    }
    // For normal clicks without modifiers, let the default navigation happen
  }, [selectRange, toggleItemSelection])

  const isItemSelected = useCallback((itemId: string) => {
    return selectedItems.has(itemId)
  }, [selectedItems])

  const handleKeyDown = useCallback((event: KeyboardEvent, allItems: VaultItem[]) => {
    if (event.key === 'Escape') {
      clearSelection()
    } else if (event.key === 'a' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      const allIds = new Set(allItems.map(item => item.id))
      setSelectedItems(allIds)
      setSelectionMode(true)
    } else if ((event.key === 'Delete' || event.key === 'Backspace') && selectedItems.size > 0) {
      event.preventDefault()
      // Trigger bulk delete - this would need to be handled by the parent component
      // For now, we'll just clear selection as a placeholder
      console.log('Bulk delete triggered for:', Array.from(selectedItems))
    } else if (event.key === 'n' && event.shiftKey && selectedItems.size > 0) {
      event.preventDefault()
      // Trigger create folder with selection
      console.log('Create folder with selection triggered for:', Array.from(selectedItems))
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