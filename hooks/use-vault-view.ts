'use client'

import { useState, useEffect } from 'react'

export function useVaultView() {
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('vault-view-compact') === 'true'
  })

  const toggleView = (compact: boolean) => {
    setIsCompact(compact)
    localStorage.setItem('vault-view-compact', String(compact))
  }

  return { isCompact, toggleView }
}