'use client'

import { useAtom, useSetAtom } from 'jotai'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import { 
  touchSelectionModeAtom, 
  enterTouchSelectionModeAtom,
  exitTouchSelectionModeAtom,
  selectedItemsCountAtom
} from '@/state/vault-selection-atoms'
import { useTouchDevice } from '@/hooks/use-touch-device'
import { cn } from '@/lib/utils'

export function SelectionModeToggle() {
  const [touchSelectionMode] = useAtom(touchSelectionModeAtom)
  const enterTouchSelection = useSetAtom(enterTouchSelectionModeAtom)
  const exitTouchSelection = useSetAtom(exitTouchSelectionModeAtom)
  const selectedCount = useAtom(selectedItemsCountAtom)[0]
  const { isTouchDevice } = useTouchDevice()

  // Only show on touch devices
  if (!isTouchDevice) return null

  if (touchSelectionMode) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {selectedCount > 0 ? `${selectedCount} selected` : 'Tap items to select'}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => exitTouchSelection()}
          className="h-8"
        >
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => enterTouchSelection()}
      className={cn(
        "h-8",
        "hover:bg-accent"
      )}
    >
      <Check className="h-4 w-4 mr-1" />
      Select
    </Button>
  )
}