# State Management Patterns

This document outlines the state management patterns and architectural decisions used in the wavflip codebase.

## Server Actions vs Client Hooks Pattern

### Current Architecture

We use a **hybrid approach** based on the complexity and requirements of each operation:

#### 1. Server Actions with `useActionState` (Preferred)
**Used for**: Library operations (folders, projects, basic CRUD)
- ✅ Server-side validation
- ✅ Automatic React Query invalidation via wrapped hooks
- ✅ Better error handling
- ✅ Form integration

#### 2. Client-side React Query Hooks
**Used for**: Track operations and complex state scenarios
- ✅ Optimistic updates
- ✅ Complex client-side state management
- ✅ Real-time UI feedback
- ⚠️ More complex but necessary for tracks

### Tracks Page Exception

**Current Status**: Tracks page uses **client-side hooks only** (React Query + mutations)

**Reasoning**: 
- Previous attempts to use server actions caused state management issues
- Tracks require complex optimistic updates and real-time feedback
- File uploads need client-side blob handling
- **TODO**: Revisit this later to potentially unify the approach

## `startTransition` Usage Patterns

### Rule: Context Determines Usage

The usage of `startTransition` with `useActionState` depends on **how the action is called**:

#### ✅ **Form Submissions** - NO `startTransition` needed
```typescript
// Dialog forms, create/rename operations
<form action={handleRename}>
  <button type="submit">Rename</button>
</form>

const [, renameAction] = useRenameProjectAction()
const handleRename = (formData: FormData) => {
  formData.append('projectId', project.id)
  renameAction(formData) // ← No startTransition needed
}
```

#### ✅ **Programmatic Calls** - `startTransition` REQUIRED
```typescript
// Drag and drop operations, direct function calls
const handleMoveProject = (projectId: string, folderId: string) => {
  const formData = new FormData()
  formData.append('projectId', projectId)
  formData.append('folderId', folderId)
  
  startTransition(() => {
    moveProjectAction(formData) // ← startTransition required
  })
}
```

### Why This Difference?

React's `useActionState` automatically handles transitions for **form submissions**, but requires manual `startTransition` for **programmatic calls** to properly manage:
- `isPending` state updates
- Error boundaries
- Suspense integration
- Concurrent rendering

## Implementation Locations

### Server Actions (with `useActionState`)
- **Folder operations**: `components/library/folders/`
- **Project operations**: `components/library/projects/` 
- **Library navigation**: Context menus, dialogs
- **Wrapped hooks**: `hooks/use-library-action.ts`

### Client Hooks (React Query)
- **Track operations**: `hooks/use-project.ts`, `hooks/use-tracks.ts`
- **File uploads**: Vercel Blob client upload
- **Player state**: `state/audio-atoms.ts` (Jotai)

## Best Practices

### When to Use Server Actions
- Simple CRUD operations
- Operations that need server-side validation
- Operations that primarily affect navigation/structure
- When form-based UX is appropriate

### When to Use Client Hooks
- Complex optimistic updates needed
- File upload operations
- Real-time feedback required
- Complex client-side state interdependencies

### React Query Invalidation
All server actions use wrapped hooks (`use-library-action.ts`) that automatically handle React Query invalidation:

```typescript
// Automatic invalidation strategies
invalidationStrategy: 'all'    // Invalidates all library data
invalidationStrategy: 'sidebar' // Invalidates sidebar only  
invalidationStrategy: 'specific' // Custom invalidation logic
```

## Future Considerations

1. **Tracks Unification**: Consider moving tracks to server actions if state management can be resolved
2. **Player Integration**: Ensure audio player state (Jotai) remains separate from data fetching (React Query)
3. **Performance**: Monitor React Query cache size and invalidation patterns
4. **Consistency**: Aim for more unified patterns where possible without sacrificing UX

## Memory References

- Prefer React Query for GET operations and server actions for non-GET operations
- Move away from revalidatePath due to async nature, prefer proper query key invalidation
- Keep audio player state separate from data fetching logic
- Use client-side uploads for large files (audio) 