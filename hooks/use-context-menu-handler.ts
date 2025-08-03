'use client'

import { useCallback } from 'react'
import { useAtomValue, useAtom } from 'jotai'
import { isSelectModeActiveAtom } from '@/state/vault-selection-atoms'
import { activeContextMenuAtom } from '@/state/ui-atoms'
import { useTouchDevice } from './use-touch-device'

export function useContextMenuHandler() {
  const isSelectModeActive = useAtomValue(isSelectModeActiveAtom)
  const [activeContextMenu, setActiveContextMenu] = useAtom(activeContextMenuAtom)
  const { isUsingTouch } = useTouchDevice()

  // Handle context menu open/close state
  const handleContextMenuOpenChange = useCallback((
    open: boolean,
    type: 'layout' | 'item'
  ) => {
    if (open) {
      setActiveContextMenu(type)
    } else if (activeContextMenu === type) {
      setActiveContextMenu(null)
    }
  }, [activeContextMenu, setActiveContextMenu])

  // Determine if a context menu should be shown
  const shouldShowContextMenu = useCallback((type: 'layout' | 'item') => {
    // Never show context menus in selection mode
    if (isSelectModeActive) return false

    // On touch devices, prevent layout context menu when item menu is active
    if (isUsingTouch && type === 'layout' && activeContextMenu === 'item') {
      return false
    }

    return true
  }, [isSelectModeActive, isUsingTouch, activeContextMenu])

  return {
    shouldShowContextMenu,
    handleContextMenuOpenChange,
    activeContextMenu,
    isUsingTouch
  }
}