## Offline Media Strategy (Streaming-first, Editing-ready)

Goals
- Default to streaming playback; rely on the browser/network cache for played chunks.
- Provide explicit Save Offline for users; persist bytes reliably for editing and offline playback.
- Prepare for in-browser editing (Tone.js, ffmpeg.wasm) with efficient file I/O.
- Keep code simple, typed, and maintainable.

Key Decisions
- Playback: stream via `/api/audio/[key]` by default; if a local copy exists, the player uses it automatically.
- Offline storage backends:
  - Primary: OPFS (Origin Private File System) where available for large files and WASM-friendly I/O.
  - Fallback: IndexedDB (idb-keyval), which we already use; persist `mimeType` alongside bytes.
- Waveforms: only persist real peaks when we actually have bytes (after Save Offline). Placeholders are never stored.
- Storage indicator: show both the browser estimate and the actual vault usage (sum of IDB/OPFS bytes).

Phased Implementation
1) Observability and UX
   - Add `useOfflineVaultSize()` and show "Offline vault" size in `StorageIndicator`.
   - Keep browser estimate alongside it.

2) Streaming-first behavior
   - Stop auto-saving new generations in `use-generations.addToSession`.
   - Save Offline remains the only path that writes bytes and posts real peaks.

3) Media store abstraction (editing-ready)
   - Introduce `lib/storage/media-store.ts` with OPFS driver + IDB fallback.
   - Migrate Save Offline to use `mediaStore`; keep IDB path as fallback for unsupported browsers.
   - Request `navigator.storage.persist()` on first save to reduce eviction risk.

4) Player hardening
   - Prefer local copy when available; otherwise stream.
   - If blob fails and we are online, deterministically fall back to stream (already implemented).

5) Editing integration (later)
   - Expose `mediaStore.readFile/writeFile/getUrlForPlayback` for Tone.js/ffmpeg.wasm.
   - Add export helpers using ffmpeg.wasm.

Internal TODOs
- [x] Show Offline vault size (sum of bytes) in UI.
- [x] Stop auto-saving audio on generation.
- [ ] Add `media-store.ts` with OPFS + IDB drivers.
- [ ] Switch Save Offline to use `mediaStore` (keep IDB fallback).
- [ ] Call `navigator.storage.persist()` on first save.
- [ ] Unit tests for size computation and storage adapter.


