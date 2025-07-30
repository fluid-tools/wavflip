import { useEffect, useState } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'

const SIDEBAR_WIDTH = 256 // 16rem
const SIDEBAR_WIDTH_MOBILE = 288 // 18rem
const SIDEBAR_WIDTH_ICON = 48 // 3rem

export function useSidebarWidth() {
  const [sidebarWidth, setSidebarWidth] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    const updateSidebarWidth = () => {
      const sidebar = document.querySelector('[data-sidebar]')
      const sidebarInset = document.querySelector('[data-sidebar-inset]')
      
      if (sidebar) {
        const state = sidebar.getAttribute('data-state')
        const variant = sidebar.getAttribute('data-variant')
        const isExpanded = state === 'expanded'
        setIsOpen(isExpanded)
        
        // For mobile, sidebar is an overlay, so width is 0
        if (isMobile) {
          setSidebarWidth(0)
          return
        }
        
        // For desktop, calculate based on state and variant
        if (isExpanded) {
          if (variant === 'inset') {
            setSidebarWidth(SIDEBAR_WIDTH)
          } else {
            setSidebarWidth(SIDEBAR_WIDTH)
          }
        } else {
          // Collapsed state
          if (variant === 'inset') {
            setSidebarWidth(SIDEBAR_WIDTH_ICON)
          } else {
            setSidebarWidth(SIDEBAR_WIDTH_ICON)
          }
        }
      } else if (sidebarInset) {
        // If we have sidebar-inset, get its padding-left
        const computedStyle = window.getComputedStyle(sidebarInset)
        const paddingLeft = computedStyle.paddingLeft
        setSidebarWidth(parseInt(paddingLeft) || 0)
      }
    }

    // Initial check
    updateSidebarWidth()

    // Listen for sidebar state changes
    const observer = new MutationObserver(updateSidebarWidth)
    const sidebar = document.querySelector('[data-sidebar]')
    const sidebarInset = document.querySelector('[data-sidebar-inset]')
    
    if (sidebar) {
      observer.observe(sidebar, {
        attributes: true,
        attributeFilter: ['data-state', 'data-variant']
      })
    }
    
    if (sidebarInset) {
      observer.observe(sidebarInset, {
        attributes: true,
        attributeFilter: ['style']
      })
    }

    // Also listen for window resize
    window.addEventListener('resize', updateSidebarWidth)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateSidebarWidth)
    }
  }, [isMobile])

  return { sidebarWidth, isOpen }
}