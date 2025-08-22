# Wavflip: Product and Architecture Overview

## What Wavflip is

Wavflip is a creator-focused studio for generating, organizing, and previewing audio. Users create projects and tracks, manage folders, preview waveforms, and play audio with a low-latency dock that supports streaming and offline.

## Product pillars

- Fast vault UX: instant navigation, optimistic mutations, consistent counts
- Studio-grade previews: accurate waveforms, range streaming via `/api/audio/[key]`
- Safe-by-default: Zod contracts on all routes, type-safe readers and actions
- Offline-friendly: OPFS/IDB-backed local vault, resumable playback

## High-level architecture

- App Router with SSR prefetch + React Query hydration for /vault and details
- Contracts:
  - Vault tree (sidebar/picker): `VaultData` (folders + rootProjects)
  - Folders list/detail: `FolderWithProjects` with recursive `subFolders`
  - Projects list: root projects with `trackCount` summary
  - Project detail: `ProjectWithTracks` with versions and activeVersion
- Data-access (server-only): `lib/server/vault/*` readers and mutations
- Player: Jotai atoms, reads presigned URLs and waveform data
- Media: presigned S3 via Redis-cached URLs, streamed through Next routes

## Current data flow

- Vault layout (RSC): prefetches `getUserFolders()` and `getRootProjects()`; client hooks hydrate.
- Sidebar/picker: `useVaultTree()` → `/api/vault/tree` (no coercion into folder contracts).
- Project page: prefetch `getProjectWithTracks()`; hydrate in client.
- Mutations: next-safe-action for CRUD where forms fit; React Query for track uploads and complex optimistic flows.

## Why we separate contracts

- Avoid overfetching: /vault shows summaries (counts), project page loads tracks
- Targeted invalidation: folder detail vs root lists vs project detail have distinct keys
- Simpler components: each view consumes exactly the data it needs

## Transitioning to Next.js "use cache"

When enabling `experimental.useCache = true`:

- Wrap readers with `"use cache"` and add tags:
  - `vault:tree`
  - `vault:folders:root`
  - `vault:folder:${folderId}`
  - `vault:projects:root`
  - `vault:project:${projectId}`
  - `waveform:${fileKey}`
- Replace manual SSR prefetch with direct RSC calls to cached readers in layout/page files.
- Keep React Query on the client for interactivity; hydration will still work (cache → RSC → serialized → client).
- Server writes call `revalidateTag` in addition to any path revalidation; client mutations still invalidate via React Query.

## Why App Router is the right fit

- Server Components keep bundles lean and enable data-close-to-view patterns
- We can selectively hydrate only the interactions that need it
- The caching model (with `"use cache"`) eliminates a lot of boilerplate without giving up React Query’s client ergonomics

## Roadmap, briefly

1. Introduce cache tags and wrap readers (no behavioral change yet)
2. Switch layout/pages to call cached readers directly (drop explicit prefetch)
3. Add tag-based revalidation to server actions
4. Optional: preview N tracks per project for /vault using a small endpoint

## Security and correctness

- Do not coerce shapes across contracts; parse with their exact Zod schemas
- Use presigned URLs only server-side; cache in Redis with TTL shorter than S3 expiry
- Validate all inputs with Zod in route handlers and actions

---
In short: Wavflip is optimized for speed and clarity today, with a clear path to fewer moving parts via Next.js "use cache"—without sacrificing optimistic UX and client-side control where it matters (uploads, playback, waveform persistence).


