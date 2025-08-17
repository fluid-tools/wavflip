# React Query Mutation Patterns

This document outlines the standardized patterns for client-side mutations in our codebase using TanStack Query (React Query) v5.

Notes:
- These patterns are used primarily for tracks, uploads, and other complex client-driven flows.
- For server actions (folders/projects CRUD, generation flows), we prefer next-safe-action. See State Management Patterns for details and the next-safe-action docs (`http://next-safe-action.dev/`).

## 🎯 Core Philosophy

- **Optimistic Updates**: Immediate UI feedback with proper rollback on errors
- **Consistent Query Keys**: Use `vaultKeys.*` functions, never hardcoded arrays
- **Memory Management**: Clean up blob URLs and other resources in `onSettled`
- **Separation of Concerns**: Clear separation between success handling, error handling, and cleanup

## 🏗️ Standard Mutation Structure

All mutations MUST follow this exact pattern:

```typescript
const mutation = useMutation({
  mutationFn: async (data) => {
    // Perform the actual API call
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      body: formData // or JSON.stringify(data)
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(error)
    }
    
    return response.json()
  },
  
  onMutate: async (data) => {
    // 1. Cancel any outgoing refetches (prevents race conditions)
    await queryClient.cancelQueries({ queryKey })
    
    // 2. Snapshot the previous value for rollback
    const previousData = queryClient.getQueryData(queryKey)
    
    // 3. Optimistically update the cache
    queryClient.setQueryData(queryKey, (oldData) => {
      if (!oldData) return oldData
      return {
        ...oldData,
        // Apply optimistic changes
      }
    })
    
    // 4. Return context object for cleanup/rollback
    return { previousData, ...otherContext }
  },
  
  onError: (error, _variables, context) => {
    // Rollback to previous state on error
    if (context?.previousData) {
      queryClient.setQueryData(queryKey, context.previousData)
    }
    
    // Show error toast
    toast.error(`Failed to perform action: ${error.message}`)
  },
  
  onSuccess: (data, variables, context) => {
    // Show success message
    toast.success('Action completed successfully')
    
    // Update cache with real server data if needed
    if (data.someField) {
      queryClient.setQueryData(queryKey, (oldData) => ({
        ...oldData,
        someField: data.someField
      }))
    }
  },
  
  onSettled: (data, error, variables, context) => {
    // ALWAYS runs regardless of success/failure
    
    // 1. Clean up any blob URLs or resources
    if (context?.optimisticBlobUrl) {
      URL.revokeObjectURL(context.optimisticBlobUrl)
    }
    
    // 2. Invalidate queries to ensure sync with server
    // Prefer using our invalidation helpers when available
    // e.g. const { invalidateProject } = useVaultInvalidation()
    // invalidateProject(projectId)
    queryClient.invalidateQueries({ queryKey })
    
    // 3. Invalidate related queries if needed
    if (isRelatedDataUpdate) {
      queryClient.invalidateQueries({ queryKey: vaultKeys.base })
    }
  }
})
```

## 🔑 Query Keys

**ALWAYS** use the centralized query key functions from `hooks/data/keys.ts`:

```typescript
// ✅ CORRECT
const queryKey = vaultKeys.project(projectId)
const queryKey = vaultKeys.folder(folderId)
const queryKey = vaultKeys.sidebar()

// ❌ WRONG - Never use hardcoded arrays
const queryKey = ['project', projectId]
const queryKey = ['vault', 'folders', folderId]
```

Available query key functions (non-exhaustive):
- `vaultKeys.base` - Base vault key
- `vaultKeys.sidebar()` - Sidebar data
- `vaultKeys.folders()` - All folders
- `vaultKeys.folder(id)` - Specific folder
- `vaultKeys.projects()` - All projects
- `vaultKeys.project(id)` - Specific project
- `vaultKeys.vaultProjects()` - Vault projects
- `vaultKeys.hierarchical(excludeId?)` - Hierarchical tree data for pickers
- `vaultKeys.stats()` - Vault statistics
- `vaultKeys.storage()` - Storage usage estimate
- `waveformKeys.all` / `waveformKeys.byKey(key)` - Waveform cache keys

Where possible in components that mutate vault data, prefer the invalidation helper from `hooks/data/use-vault.ts`:

```typescript
const { invalidateAll, invalidateSidebar, invalidateFolder, invalidateProject } = useVaultInvalidation()

onSettled: () => {
  invalidateProject(projectId)
  invalidateSidebar()
}
```

## 🖼️ Handling File Uploads & Blob URLs

For optimistic updates with files (images, audio), follow this pattern:

```typescript
onMutate: async (file: File) => {
  // Create blob URL for immediate preview
  const optimisticUrl = URL.createObjectURL(file)
  
  // Update cache with blob URL
  queryClient.setQueryData(queryKey, (oldData) => ({
    ...oldData,
    imageUrl: optimisticUrl
  }))
  
  return { previousData, optimisticUrl }
},

onSuccess: (data, variables, context) => {
  if (data.success && data.realUrl) {
    // Replace optimistic URL with real server URL
    queryClient.setQueryData(queryKey, (oldData) => ({
      ...oldData,
      imageUrl: data.realUrl
    }))
  }
},

onSettled: (data, error, variables, context) => {
  // ALWAYS clean up blob URL
  if (context?.optimisticUrl) {
    URL.revokeObjectURL(context.optimisticUrl)
  }
  // Prefer invalidation helpers where available
  queryClient.invalidateQueries({ queryKey })
}
```

## 🌳 Recursive Folder Updates

For mutations that affect nested folder structures (like project image updates), use recursive cache updates:

```typescript
// Helper function for recursive updates
const updateProjectsRecursively = (data: any, projectId: string, newImage: string): any => {
  let updated = { ...data }
  
  // Update direct projects
  if (updated.projects) {
    updated.projects = updated.projects.map((p: any) => 
      p.id === projectId 
        ? { ...p, image: newImage }
        : p
    )
  }
  
  // Update projects in subfolders recursively
  if (updated.subFolders) {
    updated.subFolders = updated.subFolders.map((subfolder: any) =>
      updateProjectsRecursively(subfolder, projectId, newImage)
    )
  }
  
  return updated
}

// Apply to all folder queries
queryClient.setQueriesData(
  { predicate: (query) => 
    query.queryKey[0] === 'vault' && 
    query.queryKey[1] === 'folders' && 
    query.queryKey.length === 3 // Individual folder: ['vault', 'folders', folderId]
  },
  (oldData: unknown) => {
    if (!oldData || typeof oldData !== 'object') return oldData
    return updateProjectsRecursively(oldData, projectId, newImageUrl)
  }
)
```

## 📝 Real-World Examples

### Project Image Upload
```typescript
// File: hooks/data/use-project.ts
const uploadImageMutation = useMutation({
  mutationFn: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch(`/api/projects/${projectId}/image`, {
      method: 'POST',
      body: formData,
    })
    if (!response.ok) throw new Error(await response.text())
    return response.json()
  },
  
  onMutate: async (file: File) => {
    await queryClient.cancelQueries({ queryKey })
    const previousProject = queryClient.getQueryData(queryKey)
    const optimisticImageUrl = URL.createObjectURL(file)
    
    // Update project cache
    queryClient.setQueryData(queryKey, (oldData) => ({
      ...oldData,
      image: optimisticImageUrl
    }))
    
    // Update all folder caches recursively
    queryClient.setQueriesData(
      { predicate: (query) => /* folder predicate */ },
      (oldData) => updateProjectsRecursively(oldData, projectId, optimisticImageUrl)
    )
    
    return { previousProject, optimisticImageUrl }
  },
  
  onError: (error, _variables, context) => {
    if (context?.previousProject) {
      queryClient.setQueryData(queryKey, context.previousProject)
    }
    // Also rollback folder caches...
    toast.error(`Failed to upload image: ${error.message}`)
  },
  
  onSuccess: (data) => {
    if (data.success && data.imageUrl) {
      // Replace with real URL in all caches
      queryClient.setQueryData(queryKey, (oldData) => ({
        ...oldData,
        image: data.imageUrl
      }))
      // Also update folder caches with real URL...
      toast.success('Project image updated successfully')
    }
  },
  
  onSettled: (data, error, variables, context) => {
    if (context?.optimisticImageUrl) {
      URL.revokeObjectURL(context.optimisticImageUrl)
    }
    // Optionally use useVaultInvalidation() helpers
  }
})
```

### Track Deletion
```typescript
// File: hooks/data/use-tracks.ts
const deleteTrackMutation = useMutation({
  mutationFn: async (trackId: string) => {
    const formData = new FormData()
    formData.append('trackId', trackId)
    formData.append('projectId', projectId)
    
    const response = await fetch('/api/tracks', {
      method: 'DELETE',
      body: formData
    })
    if (!response.ok) throw new Error(await response.text())
    return response.json()
  },
  
  onMutate: async (trackId) => {
    await queryClient.cancelQueries({ queryKey })
    const previousProject = queryClient.getQueryData(queryKey)
    
    if (previousProject) {
      const updatedTracks = previousProject.tracks?.filter(track => track.id !== trackId) || []
      queryClient.setQueryData(queryKey, {
        ...previousProject,
        tracks: updatedTracks
      })
    }
    
    return { previousProject, trackId }
  },
  
  onError: (error, _trackId, context) => {
    if (context?.previousProject) {
      queryClient.setQueryData(queryKey, context.previousProject)
    }
    toast.error(`Failed to delete track: ${error.message}`)
  },
  
  onSuccess: () => {
    toast.success('Track deleted successfully')
  },
  
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey })
  }
})
```

## ⚠️ Common Pitfalls

### ❌ DON'T: Invalidate in onSuccess
```typescript
onSuccess: () => {
  toast.success('Success!')
  queryClient.invalidateQueries({ queryKey }) // ❌ Wrong place
}
```

### ✅ DO: Invalidate in onSettled
```typescript
onSuccess: () => {
  toast.success('Success!')
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey }) // ✅ Correct place
}
```

### ❌ DON'T: Forget blob URL cleanup
```typescript
onMutate: async (file: File) => {
  const blobUrl = URL.createObjectURL(file)
  // ... update cache
  return { blobUrl }
},
onSuccess: () => {
  // ❌ Forgot to clean up blobUrl - memory leak!
}
```

### ✅ DO: Always cleanup in onSettled
```typescript
onSettled: (data, error, variables, context) => {
  if (context?.blobUrl) {
    URL.revokeObjectURL(context.blobUrl) // ✅ Always cleanup
  }
}
```

### ❌ DON'T: Use hardcoded query keys
```typescript
const queryKey = ['project', projectId] // ❌ Hardcoded
```

### ✅ DO: Use centralized query key functions
```typescript
const queryKey = vaultKeys.project(projectId) // ✅ Centralized
```

## 🔄 Migration Checklist

When updating existing mutations to follow this pattern:

- [ ] Import `vaultKeys` from `./use-vault`
- [ ] Replace hardcoded query keys with `vaultKeys.*` functions
- [ ] Add `onMutate` with proper optimistic updates
- [ ] Move invalidation from `onSuccess` to `onSettled`
- [ ] Add blob URL cleanup in `onSettled` if handling files
- [ ] Add proper TypeScript types for context objects
- [ ] Test optimistic updates work correctly
- [ ] Test error rollback works correctly
- [ ] Test memory cleanup (no blob URL leaks)

## 📎 Related: Server Actions (next-safe-action)

For server actions (e.g., creating/renaming/moving folders/projects, AI generation), we prefer using next-safe-action for type-safe inputs/outputs and centralized error handling. Define actions via `actionClient` (see `lib/safe-action.ts`) with `.inputSchema(...)` and handle them on the client with `useActionState` wrappers that call our invalidation helpers.

- Docs: `http://next-safe-action.dev/`

## 🎭 Testing Optimistic Updates

To test your mutations:

1. **Happy Path**: Verify immediate UI update → server success → final state
2. **Error Path**: Verify immediate UI update → server error → rollback to original state
3. **Memory Leaks**: Check DevTools Memory tab for blob URL cleanup
4. **Race Conditions**: Verify `cancelQueries` prevents stale updates

## 📚 Additional Resources

- [TanStack Query Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [Managing Query Keys](https://tkdodo.eu/blog/effective-react-query-keys)