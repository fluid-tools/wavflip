## Waveform + Streaming: How it works (TL;DR first)

- **Audio playback**: Always stream through `GET /api/audio/[key]` using the S3 object key. This route supports HTTP Range for progressive playback.
- **Waveform data**: Fetch from `GET /api/waveform/[key]`. Today it returns a cached placeholder (mono peaks + estimated duration). When available later, it can return real decoded peaks.
- **Player usage**:
  - `components/vault/tracks/table.tsx` builds `streamingUrl = /api/audio/${encodeURIComponent(s3Key)}` and dispatches the track to the dock.
  - `components/player/dock.tsx` initializes WaveSurfer with a pre-created `<audio>` element (MediaElement backend), optional `peaks` and `duration`, and wires player events to Jotai atoms.
  - `components/player/waveform-preview.tsx` uses WaveSurfer in read-only mode for small inline previews.


### Data model note (rename planned)

In `db/schema/vault.ts`, `trackVersion.fileUrl` actually stores the S3 object key, not a URL. We renamed it to `fileKey` across the codebase.

- Affected code now reads: `version.fileKey` in APIs and UI.
- Migration note: ensure a DB migration renames column `file_url -> file_key`.


## API contracts

### Stream audio

`GET /api/audio/[key]`

- Input: `key` (path param) — raw S3 key (e.g., `tracks/{userId}/{projectId}/{trackId}.mp3`).
- Behavior: Proxies to S3 `GetObject` with `Range` support. Returns 200 for full and 206 for partial responses.
- Headers: `Content-Type`, `Accept-Ranges: bytes`, `Content-Length`, and `Content-Range` for partial responses.

Source: `app/api/audio/[key]/route.ts`.


### Waveform data

`GET /api/waveform/[key]`

- Input: `key` (path param) — S3 key.
- Behavior today: Returns a cached placeholder waveform with estimated duration based on `ContentLength` and `ContentType` from S3 (no full decode).
- Caching: Upstash Redis `waveform:${key}`, TTL 1h.
- Response shape:
  ```json
  {
    "data": {
      "peaks": number[],
      "duration": number,
      "sampleRate": number,
      "channels": number,
      "bits": number
    },
    "isPlaceholder": true,
    "generatedAt": string,
    "key": string
  }
  ```

Notes:
- Peaks are mono (`number[]`). WaveSurfer accepts mono or per‑channel peaks. Our UIs may coerce to the expected type for the library.
- `POST /api/waveform/[key]` is reserved for future background real decode; currently a no-op placeholder.

Source: `app/api/waveform/[key]/route.ts`.


### Presigned URL (download/direct access)

`GET /api/tracks/[trackId]/presigned-url`

- Behavior: Looks up the track, finds its active version, reads `version.fileKey` (S3 key), and returns a presigned URL (1h).
- Use-cases: Direct download, image/audio `<source>` tags that require a one-shot URL. For playback, prefer the streaming proxy route above.

Source: `app/api/tracks/[trackId]/presigned-url/route.ts`.


## Component behavior

### Tracks table → Player

- File: `components/vault/tracks/table.tsx`
- On play:
  - Reads S3 key from `track.activeVersion.fileKey`.
  - Constructs `streamingUrl = /api/audio/${encodeURIComponent(s3Key)}`.
  - Dispatches `PLAY_TRACK` with `{ id, title, url: streamingUrl, duration?, createdAt, type: 'uploaded', key: s3Key }`.


### Player dock

- File: `components/player/dock.tsx`
- Key points:
  - Creates an `<audio>` element and sets `preload = 'metadata'` and `src = currentTrack.url` (the streaming URL).
  - Tries to fetch `/api/waveform/[key]` using `currentTrack.key`.
  - If available: uses peaks (+ duration) immediately. Otherwise: generates a placeholder via `generatePlaceholderWaveform()` using track duration if known (or a default).
  - Initializes WaveSurfer using `backend: 'MediaElement'` and passes the existing `<audio>` via the `media` option to avoid double-loading.
  - Wires events to Jotai atoms: `ready → SET_DURATION`, `timeupdate → SET_TIME`, `play/pause/finish → state` transitions, applies volume/mute.
  - Seeks to previous progress if the instance is recreated; supports auto‑play once.


### Inline waveform preview

- File: `components/player/waveform-preview.tsx`
- Read‑only mini waveform for lists/cards.
- If `trackKey` is provided: fetches `/api/waveform/[key]`, passes `peaks` and optional `duration` to WaveSurfer. Falls back to neutral colors when no peaks present.
- Uses `backend: 'MediaElement'` for streaming safety and passes `url` directly when a simple preview needs to play on interaction.


## Dev notes and guidelines

- Always treat `trackVersion.fileKey` as an S3 key.
- For playback, prefer `/api/audio/[key]` (Range requests, progressive). For downloads, use the presigned URL API.
- Waveform data today is a placeholder. Consumers should handle both cases:
  - Placeholder returned quickly → good UX for scrub visuals.
  - Real peaks (future) → same shape, just `isPlaceholder: false`.
- WaveSurfer config:
  - Use `backend: 'MediaElement'`.
  - If you already have an `<audio>` element, pass it via `media` and omit `url` to prevent double fetch.
  - Pass `peaks` and `duration` when known to avoid layout jank and accelerate ready state.


## Future work (non‑blocking)

- Implement background decode for real peaks, store in Redis and/or S3, and return from `GET /api/waveform/[key]` with `isPlaceholder: false`.
- Optionally store actual duration and MIME on upload/path to avoid estimating.


