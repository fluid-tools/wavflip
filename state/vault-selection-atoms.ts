'use client'

import { atom } from 'jotai'

export interface VaultItem {
  id: string
  type: 'folder' | 'project'
  name: string
}

export const selectedItemsAtom = atom<Set<string>>(new Set<string>())

export const selectionModeAtom = atom<boolean>(false)

export const touchSelectionModeAtom = atom<boolean>(false)

export const isSelectModeActiveAtom = atom(
  (get) => get(selectionModeAtom) || get(touchSelectionModeAtom)
)

export const lastSelectedItemAtom = atom<string | null>(null)

export const selectedItemsCountAtom = atom((get) => get(selectedItemsAtom).size)

export const isItemSelectedAtom = (itemId: string) => 
  atom((get) => get(selectedItemsAtom).has(itemId))

export const clearSelectionAtom = atom(
  null,
  (_, set) => {
    set(selectedItemsAtom, new Set<string>())
    set(selectionModeAtom, false)
    set(touchSelectionModeAtom, false)
    set(lastSelectedItemAtom, null)
  }
)

export const enterTouchSelectionModeAtom = atom(
  null,
  (_, set) => {
    set(touchSelectionModeAtom, true)
  }
)

export const exitTouchSelectionModeAtom = atom(
  null,
  (get, set) => {
    set(touchSelectionModeAtom, false)
    // Clear selection when exiting touch mode
    if (get(selectedItemsAtom).size > 0) {
      set(selectedItemsAtom, new Set<string>())
      set(selectionModeAtom, false)
      set(lastSelectedItemAtom, null)
    }
  }
)

export const toggleItemSelectionAtom = atom(
  null,
  (get, set, itemId: string) => {
    const selectedItems = new Set(get(selectedItemsAtom))
    
    if (selectedItems.has(itemId)) {
      selectedItems.delete(itemId)
    } else {
      selectedItems.add(itemId)
    }
    
    set(selectedItemsAtom, selectedItems)
    set(selectionModeAtom, selectedItems.size > 0)
    set(lastSelectedItemAtom, itemId)
  }
)

export const selectItemAtom = atom(
  null,
  (get, set, itemId: string, isMultiSelect = false) => {
    const selectedItems = new Set(get(selectedItemsAtom))
    
    if (!isMultiSelect) {
      selectedItems.clear()
    }
    
    selectedItems.add(itemId)
    
    set(selectedItemsAtom, selectedItems)
    set(selectionModeAtom, selectedItems.size > 0)
    set(lastSelectedItemAtom, itemId)
  }
)

export const selectRangeAtom = atom(
  null,
  (get, set, itemId: string, allItems: VaultItem[]) => {
    const lastSelected = get(lastSelectedItemAtom)
    const selectedItems = new Set(get(selectedItemsAtom))
    const wasSelected = selectedItems.has(itemId)
    
    if (!lastSelected) {
      // No previous selection, just toggle this item
      if (wasSelected) {
        selectedItems.delete(itemId)
      } else {
        selectedItems.add(itemId)
      }
    } else {
      const lastIndex = allItems.findIndex(item => item.id === lastSelected)
      const currentIndex = allItems.findIndex(item => item.id === itemId)
      
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex)
        const end = Math.max(lastIndex, currentIndex)
        
        // Clear previous selection and select range
        selectedItems.clear()
        
        for (let i = start; i <= end; i++) {
          selectedItems.add(allItems[i].id)
        }
      }
    }
    
    set(selectedItemsAtom, selectedItems)
    set(selectionModeAtom, selectedItems.size > 0)
    set(lastSelectedItemAtom, itemId)
  }
)

export const bulkDeleteSelectedAtom = atom(
  null,
  (get) => {
    const selectedItems = get(selectedItemsAtom)
    
    return Array.from(selectedItems)
  }
)