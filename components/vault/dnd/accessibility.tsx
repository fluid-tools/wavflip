import { useEffect } from 'react'
import { toast } from 'sonner'

export function DndAccessibilityAnnouncer() {
  useEffect(() => {
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', 'assertive')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.setAttribute('role', 'status')
    announcer.style.position = 'absolute'
    announcer.style.width = '1px'
    announcer.style.height = '1px'
    announcer.style.padding = '0'
    announcer.style.margin = '-1px'
    announcer.style.overflow = 'hidden'
    announcer.style.clip = 'rect(0, 0, 0, 0)'
    announcer.style.whiteSpace = 'nowrap'
    announcer.style.border = '0'
    
    document.body.appendChild(announcer)
    
    const announce = (message: string) => {
      announcer.textContent = message
      setTimeout(() => {
        announcer.textContent = ''
      }, 1000)
    }
    
    const handleDragStart = (e: CustomEvent) => {
      announce(`Started dragging ${e.detail.name}`)
    }
    
    const handleDragEnd = (e: CustomEvent) => {
      announce(`Dropped ${e.detail.name} into ${e.detail.target}`)
    }
    
    window.addEventListener('dnd:dragstart', handleDragStart as EventListener)
    window.addEventListener('dnd:dragend', handleDragEnd as EventListener)
    
    return () => {
      window.removeEventListener('dnd:dragstart', handleDragStart as EventListener)
      window.removeEventListener('dnd:dragend', handleDragEnd as EventListener)
      document.body.removeChild(announcer)
    }
  }, [])
  
  return null
}

export function useKeyboardShortcuts() {
  useEffect(() => {
    const shortcuts = {
      'cmd+x': 'Cut selected items',
      'cmd+c': 'Copy selected items',
      'cmd+v': 'Paste items',
      'cmd+z': 'Undo last action',
      'cmd+shift+z': 'Redo last action',
      'cmd+a': 'Select all items',
      'escape': 'Clear selection',
      'delete': 'Delete selected items',
      'space': 'Preview selected item',
      'enter': 'Open selected item',
    }
    
    const handleHelp = (e: KeyboardEvent) => {
      if (e.key === '?' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        const message = Object.entries(shortcuts)
          .map(([key, desc]) => `${key}: ${desc}`)
          .join('\n')
        toast.info('Keyboard Shortcuts', {
          description: message,
          duration: 10000,
        })
      }
    }
    
    window.addEventListener('keydown', handleHelp)
    return () => window.removeEventListener('keydown', handleHelp)
  }, [])
}