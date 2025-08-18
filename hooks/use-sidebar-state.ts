import { useEffect, useState } from 'react';

export function useSidebarState() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const checkSidebarState = () => {
      const sidebar = document.querySelector('[data-sidebar]');
      if (sidebar) {
        const state = sidebar.getAttribute('data-state');
        const collapsible = sidebar.getAttribute('data-collapsible');
        setIsOpen(state === 'expanded');
        setIsCollapsed(collapsible === 'offcanvas');
      }
    };

    // Initial check
    checkSidebarState();

    // Listen for sidebar state changes
    const observer = new MutationObserver(checkSidebarState);
    const sidebar = document.querySelector('[data-sidebar]');

    if (sidebar) {
      observer.observe(sidebar, {
        attributes: true,
        attributeFilter: ['data-state', 'data-collapsible'],
      });
    }

    return () => observer.disconnect();
  }, []);

  return { isOpen, isCollapsed };
}
