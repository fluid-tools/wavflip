# Vault Architecture - Unified & Clean

## 🚧 **Problem Fixed**

Previously, the vault system was a **fragmented mess** with:
- 📄 **747-line monolithic file** (`server/vault.ts`)
- 🔄 **Multiple duplicate API routes** doing the same thing
- 🏷️ **Duplicate & confusing types** (`SidebarFolder`, `HierarchicalFolder`, etc.)
- 💾 **Redundant database calls** for similar data
- 🌐 **4+ API endpoints** for essentially the same data

## ✅ **New Unified Architecture**

### 📁 **Organized Structure**
```
server/vault/
├── types.ts        # Unified types & interfaces
├── data.ts         # Core data fetching logic  
├── crud.ts         # CRUD operations (WIP)
└── index.ts        # Clean exports
```

### 🎯 **Single Source of Truth**

**One Core Function:**
```typescript
getLibraryData(userId: string, options: LibraryQueryOptions): Promise<LibraryData>
```

**Unified Options:**
```typescript
interface LibraryQueryOptions {
  includeStats?: boolean      // Include vault statistics
  includePath?: boolean       // Include folder breadcrumbs  
  includeHierarchy?: boolean  // Include nested folder structure
  excludeFolderId?: string    // Exclude folder (for move dialogs)
  specificFolderId?: string   // Get path for specific folder
  includeLevels?: boolean     // Include depth levels
}
```

**Unified Response:**
```typescript
interface LibraryData {
  folders: LibraryFolder[]        // Hierarchical folder structure
  rootProjects: LibraryProject[] // Root-level projects (vault)
  path?: BreadcrumbItem[]         // Folder breadcrumbs (if requested)
  stats?: LibraryStats           // Vault statistics (if requested)
}
```

### 🔗 **Consolidated API Routes**

**Before (Fragmented):**
- ❌ `/api/vault/sidebar` 
- ❌ `/api/vault/hierarchical-folders`
- ❌ `/api/vault/stats`
- ❌ `/api/vault/vault-projects`
- ❌ `/api/folders/[id]/path`

**After (Unified):**
- ✅ `/api/vault/sidebar` (handles everything with query params)
- ✅ `/api/folders/[id]/path` (uses unified data function)

### 📡 **Smart Query Parameters**

```typescript
// Sidebar navigation (default)
GET /api/vault/sidebar

// Move dialog with exclusion  
GET /api/vault/sidebar?exclude=folder123

// With vault statistics
GET /api/vault/sidebar?stats=true

// Everything together
GET /api/vault/sidebar?exclude=folder123&stats=true
```

### 🏷️ **Clean Types**

**Before (Duplicate):**
```typescript
interface SidebarFolder { ... }      // Almost identical
interface HierarchicalFolder { ... } // to each other
interface FolderPathItem { ... }     // with slight differences
```

**After (Unified):**
```typescript
interface LibraryFolder {            // One type to rule them all
  id: string
  name: string
  parentFolderId: string | null
  projects: LibraryProject[]
  subfolders: LibraryFolder[]        // Recursive structure
  projectCount: number
  subFolderCount: number
  level?: number                     // Optional for display
}
```

## 🎯 **Usage Examples**

### Sidebar Navigation
```typescript
const { data } = useVaultSidebar()
// Uses: getLibraryData(userId, { includeHierarchy: true })
```

### Move Dialog  
```typescript
const { data } = useQuery(['vault-data', 'hierarchical', excludeId], () =>
  fetch(`/api/vault/sidebar?exclude=${excludeId}`)
)
// Uses: getLibraryData(userId, { excludeFolderId, includeLevels: true })
```

### Folder Breadcrumbs
```typescript
const { data } = useQuery(['folder-path', folderId], () =>
  fetch(`/api/folders/${folderId}/path`)
)
// Uses: getLibraryData(userId, { includePath: true, specificFolderId })
```

### Vault Statistics
```typescript
const { data } = useVaultStats()
// Uses: getLibraryData(userId, { includeStats: true })
```

## 🚀 **Performance Benefits**

1. **Fewer Network Requests** - One endpoint serves multiple purposes
2. **Intelligent Caching** - React Query caches unified data structure  
3. **Reduced Database Calls** - Single query builds complete hierarchy
4. **Smart Query Params** - Only fetch what you need
5. **Code Reuse** - Server logic shared across routes & actions

## 🧹 **Clean Code Benefits**

1. **Single Responsibility** - Each module has clear purpose
2. **DRY Principle** - No duplicate data fetching logic
3. **Type Safety** - Unified types prevent inconsistencies  
4. **Maintainability** - Easy to modify and extend
5. **Developer Experience** - Clear API surface, predictable behavior

## 🔄 **Migration Status**

✅ **Completed:**
- Unified data fetching logic
- Consolidated API routes  
- Updated React Query hooks
- Fixed folder picker hierarchy
- Cleaned up duplicate types

🚧 **In Progress:**
- CRUD operations refactor (`crud.ts` has linter issues)
- Complete removal of old `vault.ts` file
- Server actions migration to new structure

## 📋 **Next Steps**

1. Fix CRUD operations TypeScript issues
2. Migrate server actions to use new structure  
3. Remove legacy functions from old `vault.ts`
4. Add comprehensive error handling
5. Optimize database queries further

---

**Result: Clean, maintainable, and performant vault architecture! 🎉** 