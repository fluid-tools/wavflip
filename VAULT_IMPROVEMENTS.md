# Vault Improvements Implementation Plan

## Overview
This document outlines the implementation plan for improving the vault system with better SSR hydration and multiple selection functionality.

## 1. TanStack Query Hydration Strategy

### Current Issues
- Server components pass data as props to client components
- Client components use `placeholderData` which doesn't provide optimal hydration
- No proper dehydration/hydration setup for SSR

### Solution
Implement proper TanStack Query hydration using `HydrationBoundary` and `dehydrate`:

```typescript
// Server components prefetch data and dehydrate query client
const queryClient = new QueryClient()
await queryClient.prefetchQuery({
  queryKey: vaultKeys.folders(),
  queryFn: () => getUserFolders(session.user.id)
})

return (
  <HydrationBoundary state={dehydrate(queryClient)}>
    <VaultView />
  </HydrationBoundary>
)
```

### Benefits
- Eliminates prop drilling
- Better cache consistency
- Automatic background refetching
- Optimistic updates work seamlessly

## 2. Multiple Selection System

### State Management
Create Jotai atoms for selection state:
- `selectedItemsAtom`: Set of selected item IDs
- `selectionModeAtom`: Boolean for selection mode
- `lastSelectedItemAtom`: For range selection

### Selection Behavior
- **Click**: Single select (clear others)
- **Shift+Click**: Range select from last selected
- **Ctrl/Cmd+Click**: Toggle individual item
- **Escape**: Clear all selections

### Visual Feedback
- Selected items: `ring-2 ring-primary` styling
- Selection counter in header
- Bulk action toolbar when items selected

## 3. Context Menu Behavior Fix

### Problem
Context menu shows "New Folder/Project" when right-clicking on items

### Solution
- Item context menus: Only show item-specific actions (Rename, Move, Delete)
- Layout context menu: Only show "New Folder/Project" on empty space clicks
- Use `event.stopPropagation()` on item context menus

## 4. Bulk Actions

### Actions
1. **Create Folder with Selection**: Move selected items into new folder
2. **Bulk Delete**: Delete all selected items with confirmation
3. **Move to Folder**: Dropdown to select destination folder

### Keyboard Shortcuts
- `Shift+N`: Create folder with selection
- `Delete/Backspace`: Bulk delete selected items
- `Escape`: Clear selection

## Implementation Order

1. ✅ Document plan
2. 🔄 Implement TanStack Query hydration
3. 🔄 Create selection state management
4. 🔄 Implement multiple selection functionality
5. 🔄 Fix context menu behavior
6. 🔄 Create bulk actions toolbar
7. 🔄 Add keyboard shortcuts

## Files to Modify

### New Files
- `state/vault-selection-atoms.ts` - Selection state management
- `components/vault/bulk-actions-toolbar.tsx` - Bulk actions UI
- `hooks/use-vault-selection.ts` - Selection logic hook

### Modified Files
- `app/(protected)/vault/page.tsx` - Add hydration boundary
- `app/(protected)/vault/folders/[folderId]/page.tsx` - Add hydration boundary
- `app/(protected)/vault/projects/[projectId]/page.tsx` - Add hydration boundary
- `app/(protected)/vault/client.tsx` - Remove prop drilling, add selection
- `components/vault/folders/card.tsx` - Add selection behavior
- `components/vault/projects/card.tsx` - Add selection behavior
- `components/vault/dnd/droppable-wrapper.tsx` - Fix context menu behavior
- `hooks/data/use-vault.ts` - Remove placeholderData pattern

## Testing Strategy
- Manual testing of selection behavior
- Context menu behavior verification
- Keyboard shortcut testing
- SSR hydration verification with network throttling