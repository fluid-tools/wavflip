'use client'

import { useAtom, useSetAtom } from 'jotai'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import { 
  isSelectModeActiveAtom,
  enterTouchSelectionModeAtom,
  exitTouchSelectionModeAtom,
  enterSelectionModeAtom,
  exitSelectionModeAtom,
  selectedItemsCountAtom
} from '@/state/vault-selection-atoms'
import { useTouchDevice } from '@/hooks/use-touch-device'
import { cn } from '@/lib/utils'

export function SelectionModeToggle() {
  const [isSelectModeActive] = useAtom(isSelectModeActiveAtom)
  const enterTouchSelection = useSetAtom(enterTouchSelectionModeAtom)
  const exitTouchSelection = useSetAtom(exitTouchSelectionModeAtom)
  const enterSelection = useSetAtom(enterSelectionModeAtom)
  const exitSelection = useSetAtom(exitSelectionModeAtom)
  const selectedCount = useAtom(selectedItemsCountAtom)[0]
  const { isTouchDevice } = useTouchDevice()

  const handleEnterSelection = () => {
    if (isTouchDevice) {
      enterTouchSelection()
    } else {
      enterSelection()
    }
  }

  const handleExitSelection = () => {
    if (isTouchDevice) {
      exitTouchSelection()
    } else {
      exitSelection()
    }
  }

  if (isSelectModeActive) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {selectedCount > 0 ? `${selectedCount} selected` : (isTouchDevice ? 'Tap items to select' : 'Click items to select')}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleExitSelection}
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
      onClick={handleEnterSelection}
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