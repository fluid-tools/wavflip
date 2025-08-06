'use client'

import { atom } from 'jotai'

export interface VaultItem {
  id: string
  type: 'folder' | 'project'
  name: string
}

export const selectedItemsAtom = atom<Set<string>>(new Set<string>())

export const selectionModeAtom = atom<boolean>(false)

export const isSelectModeActiveAtom = atom(
  (get) => get(selectionModeAtom)
)

// This tracks the last item that was clicked (not shift/cmd clicked)
// This serves as the anchor point for shift-click range selections
export const selectionAnchorAtom = atom<string | null>(null)

export const selectedItemsCountAtom = atom((get) => get(selectedItemsAtom).size)

export const clearSelectionAtom = atom(
  null,
  (_, set) => {
    set(selectedItemsAtom, new Set<string>())
    set(selectionModeAtom, false)
    set(selectionAnchorAtom, null)
  }
)

export const enterSelectionModeAtom = atom(
  null,
  (_, set) => {
    set(selectionModeAtom, true)
  }
)

// Cmd/Ctrl click - toggle selection of this item
export const toggleItemSelectionAtom = atom(
  null,
  (get, set, itemId: string) => {
    const selectedItems = new Set(get(selectedItemsAtom))
    
    if (selectedItems.has(itemId)) {
      selectedItems.delete(itemId)
      // If this was the anchor and we're deselecting it, clear anchor
      if (get(selectionAnchorAtom) === itemId) {
        set(selectionAnchorAtom, null)
      }
    } else {
      selectedItems.add(itemId)
      set(selectionAnchorAtom, itemId)
    }
    
    set(selectedItemsAtom, selectedItems)
    // Enter selection mode when toggling items
    if (selectedItems.size > 0) {
      set(selectionModeAtom, true)
    } else {
      set(selectionModeAtom, false)
    }
  }
)

// Shift click - select range from anchor to clicked item
export const selectRangeAtom = atom(
  null,
  (get, set, itemId: string, allItems: VaultItem[]) => {
    const anchor = get(selectionAnchorAtom)
    const selectedItems = new Set(get(selectedItemsAtom))
    
    if (!anchor) {
      // No anchor, just select this item
      selectedItems.clear()
      selectedItems.add(itemId)
      set(selectionAnchorAtom, itemId)
    } else {
      const anchorIndex = allItems.findIndex(item => item.id === anchor)
      const currentIndex = allItems.findIndex(item => item.id === itemId)
      
      if (anchorIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(anchorIndex, currentIndex)
        const end = Math.max(anchorIndex, currentIndex)
        
        // Add range to existing selection (don't clear)
        for (let i = start; i <= end; i++) {
          selectedItems.add(allItems[i].id)
        }
      }
    }
    
    set(selectedItemsAtom, selectedItems)
    // Always enter selection mode when shift-clicking (range selection)
    set(selectionModeAtom, true)
    // Don't update anchor on shift-click
  }
)

export const bulkDeleteSelectedAtom = atom(
  null,
  (get) => {
    const selectedItems = get(selectedItemsAtom)
    
    return Array.from(selectedItems)
  }
)