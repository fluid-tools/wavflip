'use client'

import { useAtom } from 'jotai'
import { Grid3X3, Grid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { vaultViewCompactAtom, toggleVaultViewAtom } from '@/state/ui-atoms'

export function ViewToggle() {
  const [isCompact] = useAtom(vaultViewCompactAtom)
  const [, onToggle] = useAtom(toggleVaultViewAtom)
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onToggle(false)}
        className={cn(
          "h-8 w-8 p-0",
          !isCompact ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Grid className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onToggle(true)}
        className={cn(
          "h-8 w-8 p-0",
          isCompact ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
    </div>
  )
}