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
  selectSingleItemAtom,
  selectRangeAtom,
  touchSelectionModeAtom,
  isSelectModeActiveAtom,
  type VaultItem
} from '@/state/vault-selection-atoms'
import { useTouchDevice } from '@/hooks/use-touch-device'

export function useVaultSelection() {
  const [selectedItems, setSelectedItems] = useAtom(selectedItemsAtom)
  const [selectionMode, setSelectionMode] = useAtom(selectionModeAtom)
  const touchSelectionMode = useAtomValue(touchSelectionModeAtom)
  const isSelectModeActive = useAtomValue(isSelectModeActiveAtom)
  const selectedCount = useAtomValue(selectedItemsCountAtom)
  const clearSelection = useSetAtom(clearSelectionAtom)
  const toggleItemSelection = useSetAtom(toggleItemSelectionAtom)
  const selectSingleItem = useSetAtom(selectSingleItemAtom)
  const selectRange = useSetAtom(selectRangeAtom)
  const { isUsingTouch } = useTouchDevice()

  const handleItemClick = useCallback((
    itemId: string,
    event: React.MouseEvent,
    allItems: VaultItem[]
  ) => {
    const isSelected = selectedItems.has(itemId)
    const hasMultipleSelected = selectedItems.size > 1

    // In touch selection mode or any active selection mode, always handle selection
    if (touchSelectionMode || isSelectModeActive) {
      event.preventDefault()
      event.stopPropagation()
      toggleItemSelection(itemId)
      return
    }

    // Handle modifier keys
    if (event.shiftKey) {
      // Shift-click: range selection
      event.preventDefault()
      event.stopPropagation()
      selectRange(itemId, allItems)
    } else if (event.ctrlKey || event.metaKey) {
      // Cmd/Ctrl-click: toggle selection
      event.preventDefault()
      event.stopPropagation()
      toggleItemSelection(itemId)
    } else {
      // Regular click
      if (isSelected) {
        if (hasMultipleSelected) {
          // Clicking on selected item when multiple selected: clear others, keep this one
          event.preventDefault()
          event.stopPropagation()
          selectSingleItem(itemId)
        }
        // If single item selected, allow navigation (don't prevent default)
      } else {
        // Clicking on unselected item: clear all and select this one
        event.preventDefault()
        event.stopPropagation()
        selectSingleItem(itemId)
      }
    }
  }, [selectedItems, touchSelectionMode, isSelectModeActive, toggleItemSelection, selectSingleItem, selectRange])

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
    touchSelectionMode,
    isSelectModeActive,
    isItemSelected,
    handleItemClick,
    handleKeyDown,
    clearSelection,
    toggleItemSelection,
    selectSingleItem,
    selectRange,
    isUsingTouch
  }
}

export function useItemSelection(itemId: string) {
  const isSelected = useAtomValue(isItemSelectedAtom(itemId))
  return isSelected
}