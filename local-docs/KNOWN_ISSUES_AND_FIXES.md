# Known Issues and Fixes

This document captures niche problems we encountered and the patterns we use to fix them.

## 1) RSC header loss when caching session reads

- Context: Using `unstable_cache` to cache `auth.api.getSession()` in RSC led to occasional header loss (cookies not attached), causing false unauthenticated states.
- Root cause: RSC/caching boundaries can detach request-bound headers unless explicitly reattached.
- Fix: avoid framework-level caching for sessions; enable Better Auth cookie cache and always bind cookies explicitly when calling `getSession`.

```ts
// lib/auth.ts
export const auth = betterAuth({
  // ...
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
});
```

```ts
// lib/server/auth.ts
import 'server-only';
import { auth } from '../auth';
import { cookies } from 'next/headers';

async function getCookieHeaderString(): Promise<string> {
  const store = await cookies();
  return store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .sort()
    .join('; ');
}

export async function getCachedSession() {
  try {
    const h = new Headers();
    const cookieHeader = await getCookieHeaderString();
    if (cookieHeader) h.set('cookie', cookieHeader);
    return await auth.api.getSession({ headers: h });
  } catch {
    return null;
  }
}
```

Notes:
- Session caching stays inside Better Auth (signed cookie). No duplication with framework caches.
- If adopting Next.js `"use cache"` for other readers, bind cookies explicitly for any reader that relies on them.
- For explicit session invalidation after auth changes, call `revalidateTag('session')` via `revalidateSession()`.

## 2) Future: `"use cache"` + tags for readers

- Wrap readers (`getUserFolders`, `getRootProjects`, `getFolderWithContents`, `getProjectWithTracks`) with `"use cache"` and add tags.
- Server writes (actions) call `revalidateTag(tag)`; client keeps React Query for optimistic writes/live UX.

Suggested tags:
- `vault:tree`
- `vault:folders:root`
- `vault:folder:${folderId}`
- `vault:projects:root`
- `vault:project:${projectId}`
- `waveform:${fileKey}`

