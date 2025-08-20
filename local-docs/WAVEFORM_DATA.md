## Waveform data flow (GET/POST + caching)

Goals:
- Never persist placeholder peaks locally
- Centralize GET/POST and cache invalidation
- Use React Query with IDB persistence (see `state/providers.tsx`)

### API (current)
- GET `/api/waveform/[key]` → `{ data: { peaks, duration, sampleRate, channels, bits }, isPlaceholder, generatedAt, key }`
  - Server checks Redis cache first. If missing, it generates a placeholder on the fly (not persisted server-side) and returns it.
- POST `/api/waveform/[key]` with real `{ peaks, duration, sampleRate, channels }`
  - Stored in Redis without TTL and updates DB duration best-effort.

### Client hook
`hooks/data/use-waveform.ts`
- `useWaveform(key)` exposes `{ data, isPlaceholder, isLoading, refetch, persist }`
- Query key: `waveformKeys.byKey(key)` from `hooks/data/keys.ts`
- `persist` POSTs real peaks, optimistically sets `{ isPlaceholder: false, ... }` in the cache, then invalidates so the next GET confirms.
- No localStorage/Jotai is used. React Query cache persists via IDB.

### Components
- `components/player/dock.tsx` and `components/player/waveform-preview.tsx`
  - For streaming URLs: read peaks from `useWaveform(key)` only.
  - For offline blob URLs: decode locally for UI; if you also want to persist, call `persist` from the hook with decoded peaks.

### Generations / Offline
- When a track is saved offline or newly generated, we decode and POST real peaks.
- After successful POST, we call `invalidateQueries({ queryKey: waveformKeys.byKey(key) })` so any open views re-fetch and replace placeholders.

### Notes
- Server sanitizes incoming `peaks` (clamps values to [0,1] and caps array length to 4000) before caching.
- Placeholder responses are not stored server-side; they may exist briefly in the client cache (IDB) and will be replaced after a successful POST + refetch.

### RSC + "use cache" plan

- Wrap the reader for GET `/api/waveform/[key]` with `"use cache"` and tag `waveform:${fileKey}`.
- When POST succeeds, in addition to client invalidation, call `revalidateTag('waveform:${fileKey}')` to evict the server cache entry.
- Server still clamps/sanitizes; client keeps IDB persistence for offline UX.
