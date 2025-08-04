'use client'

import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

// Vault view state - persisted to localStorage
export const vaultViewCompactAtom = atomWithStorage('vault-view-compact', false)

// Derived atom for toggling the view
export const toggleVaultViewAtom = atom(
  null,
  (_get, set, compact: boolean) => {
    set(vaultViewCompactAtom, compact)
  }
)

