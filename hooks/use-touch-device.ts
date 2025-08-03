'use client'

import { useEffect, useState } from 'react'

export function useTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [currentInputMethod, setCurrentInputMethod] = useState<'touch' | 'mouse'>('mouse')

  useEffect(() => {
    // Check if device has touch capability
    const checkTouchCapability = () => {
      const hasTouch = (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - vendor prefix
        navigator.msMaxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches
      )
      setIsTouchDevice(hasTouch)
    }

    // Track current input method
    const handleTouchStart = () => setCurrentInputMethod('touch')
    const handleMouseMove = () => setCurrentInputMethod('mouse')

    checkTouchCapability()

    // Listen for input method changes
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return {
    isTouchDevice,
    currentInputMethod,
    isUsingTouch: currentInputMethod === 'touch'
  }
}