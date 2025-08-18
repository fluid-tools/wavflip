'use client';

import { useAtomValue } from 'jotai';
import { isSelectModeActiveAtom } from '@/state/vault-selection-atoms';

export function useContextMenuHandler() {
  const isSelectModeActive = useAtomValue(isSelectModeActiveAtom);

  const shouldShowContextMenu = () => {
    // Only show context menus when not in selection mode
    return !isSelectModeActive;
  };

  return {
    shouldShowContextMenu,
  };
}
