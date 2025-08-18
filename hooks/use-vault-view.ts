'use client';

import { useAtom } from 'jotai';
import { toggleVaultViewAtom, vaultViewCompactAtom } from '@/state/ui-atoms';

export function useVaultView() {
  const [isCompact] = useAtom(vaultViewCompactAtom);
  const [, toggleView] = useAtom(toggleVaultViewAtom);

  return { isCompact, toggleView };
}
