'use client'

import { useCallback } from 'react'
import { useAtomValue } from 'jotai'
import { isSelectModeActiveAtom } from '@/state/vault-selection-atoms'
import { useTouchDevice } from './use-touch-device'

export function useContextMenuHandler() {
  const isSelectModeActive = useAtomValue(isSelectModeActiveAtom)
  const { isUsingTouch } = useTouchDevice()

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

    // On touch devices, prevent layout context menu when clicking on items
    if (isUsingTouch && !isLayoutMenu) {
      // This is an item context menu, stop propagation to prevent layout menu
      event.stopPropagation()
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