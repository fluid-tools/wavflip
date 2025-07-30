# Vault System Requirements & Implementation Plan

## Overview
Building a new hierarchical vault system with drag-and-drop functionality, versioning, and Mac Finder-style UI. This is separate from the existing vault and uses PostgreSQL with proper schema design.

## Hierarchy Structure

```
Vault (Root)
├── Folders
│   ├── Sub-folders (nested folders)
│   │   ├── Projects
│   │   │   └── Tracks (with versions)
│   │   └── More sub-folders...
│   └── Projects
│       └── Tracks (with versions)
└── Projects (can exist directly in vault)
    └── Tracks (with versions)
```

### Rules
- **Vault**: Contains folders and projects
- **Folders**: Can contain projects AND other folders (unlimited nesting)
- **Projects**: Can only contain tracks
- **Tracks**: Have multiple versions, one active version
- **Empty folders**: Can exist, show "Add Folder/Project" placeholders
- **Auto-deletion**: Empty folders without content get deleted
- **Auto-creation**: Dragging track to folder creates new project named after track

## Database Schema

### Core Tables

```sql
-- Folders
folders {
  id: text (primary key)
  name: text (not null)
  userId: text (foreign key to user.id)
  order: integer (for custom sorting)
  createdAt: timestamp
  updatedAt: timestamp
}

-- Projects  
projects {
  id: text (primary key)
  name: text (not null)
  folderId: text (nullable, foreign key to folders.id)
  userId: text (foreign key to user.id)
  accessType: enum ('private', 'public', 'invite-only') default 'private'
  order: integer (for custom sorting)
  createdAt: timestamp
  updatedAt: timestamp
  metadata: json (flexible additional data)
}

-- Tracks (metadata only)
tracks {
  id: text (primary key)
  name: text (not null)
  projectId: text (foreign key to projects.id)
  userId: text (foreign key to user.id)
  activeVersionId: text (foreign key to track_versions.id)
  accessType: enum ('private', 'public', 'invite-only') default 'private'
  order: integer (for custom sorting)
  createdAt: timestamp
  updatedAt: timestamp
  metadata: json (flexible additional data)
}

-- Track Versions (actual file data)
track_versions {
  id: text (primary key)
  trackId: text (foreign key to tracks.id)
  version: integer (auto-increment per track)
  fileUrl: text (not null - points to storage)
  size: bigint (bytes)
  duration: float (seconds)
  mimeType: text
  createdAt: timestamp
  metadata: json (version-specific data)
}
```

### Constraints & Indexes
- Unique folder names per user
- Unique project names per folder/vault
- Unique track names per project
- Composite indexes for performance
- Foreign key cascades for cleanup

## User Interface Design

### Layout Style
- **Mac Finder-inspired card layout**
- **Responsive grid system**
- **Light/dark mode support**
- **Clean, minimal design**

### Navigation Pattern
```
/vault (vault root)
├── /vault/folders/[folderId] (folder view)
└── /vault/projects/[projectId] (project view)
```

### Visual Hierarchy
- **Folders**: Folder icon, name, project count
- **Projects**: Music note icon, name, track count, access badge
- **Tracks**: Waveform thumbnail, name, duration, version indicator
- **Empty states**: Placeholder cards with "+" buttons

## Drag & Drop Functionality

### Supported Operations
1. **Tracks → Projects**: Move track between projects
2. **Projects → Folders**: Move project between folders/vault
3. **Tracks → Folders**: Create new project in folder

### Visual Feedback
- **Drag initiation**: Semi-transparent drag preview
- **Valid drop zones**: Highlight with border/background
- **Invalid zones**: Red indicator or disabled state
- **Insertion indicators**: Show where item will be placed
- **Auto-scroll**: When dragging near edges

### Implementation
- **@dnd-kit/core** for drag and drop
- **@dnd-kit/sortable** for reordering
- **Custom drop zones** for cross-container moves
- **Optimistic UI updates** with rollback on error

## Track Versioning System

### Version Management
- **Separate table approach** for performance
- **Active version pointer** on main track
- **Auto-incrementing version numbers**
- **Immutable version history**

### Version Operations
```typescript
// Create new version
await createTrackVersion(trackId, {
  fileUrl: 'https://storage.com/track-v2.mp3',
  size: 5242880,
  duration: 180.5,
  mimeType: 'audio/mpeg'
})

// Switch active version
await setActiveVersion(trackId, versionId)

// Get version history
const versions = await getTrackVersions(trackId)
```

## Access Control & Sharing

### Access Types
- **Private**: Only owner can access (default)
- **Public**: Anyone with link can access
- **Invite-only**: Specific users can access

### Sharing Granularity
- **Individual tracks**: Share specific track versions
- **Entire projects**: Share all tracks in project
- **Folders**: Not shareable (only projects/tracks)

## Data Management

### Storage Strategy
- **Metadata**: PostgreSQL database
- **Audio files**: External storage (Vercel Blob, S3, etc.)
- **Local files**: IndexedDB for offline/local tracks
- **File references**: URLs in database, actual files elsewhere

### State Management
- **No React Query**: Simple useState + server actions
- **Server components**: For initial data loading
- **Client components**: For interactive features
- **Optimistic updates**: For better UX

## Component Architecture

### Page Structure
```
app/(protected)/vault/
├── page.tsx (vault root)
├── folders/[folderId]/page.tsx
├── projects/[projectId]/page.tsx
└── loading.tsx
components/vault/
actions/vault.ts
```

### Reusable Components
- **Card components**: Consistent styling
- **Drag wrappers**: DnD functionality
- **Empty states**: Placeholder content
- **Loading skeletons**: Smooth loading experience

## Features & Interactions

### Core Features
- [x] Hierarchical folder/project/track structure
- [x] Drag and drop reordering and moving
- [x] Track versioning with history
- [x] Access control and sharing
- [x] Custom sorting within containers
- [x] Auto-project creation from track drops
- [x] Empty folder management

### Nice-to-Have Features
- [ ] Bulk operations (multi-select)
- [ ] Search and filtering
- [ ] Keyboard shortcuts
- [ ] Context menus
- [ ] Version diff viewer
- [ ] Collaborative editing indicators
- [ ] Activity/audit log

## Technical Implementation

### Tech Stack
- **Frontend**: Next.js 15 App Router, React 19
- **Database**: PostgreSQL with Drizzle ORM
- **Drag & Drop**: @dnd-kit
- **UI**: ShadCN components, Tailwind CSS
- **State**: useState (no external state manager)
- **Storage**: Vercel Blob, IndexedDB for local

### Performance Considerations
- **Lazy loading**: Load tracks on project open
- **Virtualization**: react-virtuoso for large lists
- **Optimistic updates**: Immediate UI feedback
- **Smart caching**: Server-side data fetching
- **Debounced operations**: For drag operations

## Development Phases

### Phase 1: Schema & Database ✅
- [x] Create database schema (`db/schema/vault.ts`)
- [ ] Set up Drizzle migrations  
- [ ] Create basic CRUD operations
- [ ] Test versioning system

### Phase 2: Core UI Components
- [ ] Basic card components
- [ ] Page layouts and routing
- [ ] Empty states and loading
- [ ] Responsive design

### Phase 3: Drag & Drop
- [ ] DnD context setup
- [ ] Drag overlays and previews
- [ ] Drop zone highlighting
- [ ] Move operations and API

### Phase 4: Advanced Features
- [ ] Access control UI
- [ ] Version management UI
- [ ] Sharing functionality
- [ ] Search and filters

### Phase 5: Polish & Testing
- [ ] Performance optimization
- [ ] Error handling
- [ ] User testing and feedback
- [ ] Documentation

## Success Criteria

### Functionality
- ✅ Smooth drag and drop operations
- ✅ Reliable version management
- ✅ Intuitive navigation
- ✅ Fast performance with large libraries
- ✅ No data loss or corruption

### User Experience
- ✅ Mac Finder-like familiarity
- ✅ Clear visual hierarchy
- ✅ Responsive across devices
- ✅ Accessible interactions
- ✅ Delightful micro-interactions

### Technical
- ✅ Clean, maintainable code
- ✅ Proper separation of concerns
- ✅ Scalable architecture
- ✅ Comprehensive error handling
- ✅ Good TypeScript coverage

---

## Next Steps

1. **Create database schema** in `db/schema/vault.ts`
2. **Set up basic page structure** with routing
3. **Build core components** for vault/folder/project views
4. **Implement drag and drop** with @dnd-kit
5. **Add versioning UI** for track management
6. **Polish and optimize** for production use

This document serves as the single source of truth for the vault system implementation. 