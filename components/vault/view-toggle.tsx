'use client'

import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ViewToggleProps {
  isCompact: boolean
  onToggle: (compact: boolean) => void
}

export function ViewToggle({ isCompact, onToggle }: ViewToggleProps) {
  return (
    <div className="flex items-center border rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onToggle(false)}
        className={cn(
          "h-7 px-2",
          !isCompact ? "bg-background shadow-sm" : "hover:bg-transparent"
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onToggle(true)}
        className={cn(
          "h-7 px-2",
          isCompact ? "bg-background shadow-sm" : "hover:bg-transparent"
        )}
      >
        <List className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}