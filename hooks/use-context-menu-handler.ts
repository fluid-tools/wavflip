'use client'

import { useCallback, useRef } from 'react'
import { useAtomValue } from 'jotai'
import { isSelectModeActiveAtom } from '@/state/vault-selection-atoms'
import { useTouchDevice } from './use-touch-device'

export function useContextMenuHandler() {
  const isSelectModeActive = useAtomValue(isSelectModeActiveAtom)
  const { isUsingTouch } = useTouchDevice()
  const itemContextMenuActiveRef = useRef(false)

  const handleContextMenu = useCallback((
    event: React.MouseEvent,
    options?: {
      allowInSelectionMode?: boolean
      isLayoutMenu?: boolean
    }
  ) => {
    const { allowInSelectionMode = false, isLayoutMenu = false } = options || {}

    // Prevent context menu in selection mode unless explicitly allowed
    if (isSelectModeActive && !allowInSelectionMode) {
      event.preventDefault()
      event.stopPropagation()
      return false
    }

    // On touch devices, handle context menu conflicts
    if (isUsingTouch) {
      if (isLayoutMenu) {
        // This is a layout context menu - only show if no item menu is active
        if (itemContextMenuActiveRef.current) {
          event.preventDefault()
          event.stopPropagation()
          return false
        }
      } else {
        // This is an item context menu - prevent layout menu and mark as active
        itemContextMenuActiveRef.current = true
        event.stopPropagation()
        
        // Clear the flag after a short delay to allow for menu interactions
        setTimeout(() => {
          itemContextMenuActiveRef.current = false
        }, 100)
      }
    }

    return true
  }, [isSelectModeActive, isUsingTouch])

  const preventContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  return {
    handleContextMenu,
    preventContextMenu,
    shouldShowContextMenu: !isSelectModeActive,
    isUsingTouch
  }
}