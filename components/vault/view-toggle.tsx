'use client';

import { useAtom } from 'jotai';
import { Grid, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toggleVaultViewAtom, vaultViewCompactAtom } from '@/state/ui-atoms';

export function ViewToggle() {
  const [isCompact] = useAtom(vaultViewCompactAtom);
  const [, onToggle] = useAtom(toggleVaultViewAtom);
  return (
    <div className="flex items-center gap-1">
      <Button
        className={cn(
          'h-8 w-8 p-0',
          isCompact
            ? 'text-muted-foreground hover:text-foreground'
            : 'bg-accent text-accent-foreground'
        )}
        onClick={() => onToggle(false)}
        size="sm"
        variant="ghost"
      >
        <Grid className="h-4 w-4" />
      </Button>
      <Button
        className={cn(
          'h-8 w-8 p-0',
          isCompact
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => onToggle(true)}
        size="sm"
        variant="ghost"
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
    </div>
  );
}
