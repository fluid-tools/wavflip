## Waveform data flow (GET/POST + caching)

Goals:
- Never persist placeholder peaks locally
- Centralize GET/POST and cache invalidation
- Use React Query with IDB persistence (see `state/providers.tsx`)

### API
- GET `/api/waveform/[key]` → `{ data: {peaks, duration, ...}, isPlaceholder }`
  - Placeholders carry short cache headers. Real peaks have longer cache.
- POST `/api/waveform/[key]` with real `{peaks, duration, sampleRate, channels}`
  - Stored in Redis without TTL and updates DB duration best-effort.

### Client hook
`hooks/data/use-waveform.ts`
- `useWaveform(key)` exposes `{ data, isPlaceholder, isLoading, refetch, persist }`
- Query key: `['waveform', key]`
- `persist` POSTs real peaks then optimistically sets the query data and invalidates so the next GET confirms.
- No localStorage/Jotai is used. React Query cache persists via IDB.

### Components
- `components/player/dock.tsx` and `components/player/waveform-preview.tsx`
  - For streaming URLs: read peaks from `useWaveform(key)` only.
  - For offline blob URLs: decode locally for UI; if you also want to persist, call `persist` from the hook with decoded peaks.
  - No manual `fetch('/api/waveform/...')` and no writes to `wf-peaks-cache`.

### Generations / Offline
- When a track is saved offline or newly generated, we decode and POST real peaks.
- After successful POST, we call `invalidateQueries(['waveform', key])` so any open views re-fetch and replace placeholders.
