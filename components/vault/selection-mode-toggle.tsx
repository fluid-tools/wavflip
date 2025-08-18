'use client';

import { useAtom, useSetAtom } from 'jotai';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  clearSelectionAtom,
  enterSelectionModeAtom,
  isSelectModeActiveAtom,
  selectedItemsCountAtom,
} from '@/state/vault-selection-atoms';

export function SelectionModeToggle() {
  const [isSelectModeActive] = useAtom(isSelectModeActiveAtom);
  const enterSelection = useSetAtom(enterSelectionModeAtom);
  const clearSelection = useSetAtom(clearSelectionAtom);
  const selectedCount = useAtom(selectedItemsCountAtom)[0];

  const handleEnterSelection = () => {
    enterSelection();
  };

  const handleExitSelection = () => {
    clearSelection();
  };

  if (isSelectModeActive) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">
          {selectedCount > 0
            ? `${selectedCount} selected`
            : 'Click items to select'}
        </span>
        <Button
          className="h-8"
          onClick={handleExitSelection}
          size="sm"
          variant="ghost"
        >
          <X className="mr-1 h-4 w-4" />
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      className={cn('h-8', 'hover:bg-accent')}
      onClick={handleEnterSelection}
      size="sm"
      variant="outline"
    >
      <Check className="mr-1 h-4 w-4" />
      Select
    </Button>
  );
}
