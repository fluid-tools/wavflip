/**
 * Media storage abstraction for large audio files.
 *
 * Policy: OPFS-only for media bytes. No IndexedDB fallback for audio data.
 * IDB is reserved strictly for lightweight metadata (handled by local-vault).
 */

export interface MediaStore {
  writeFile(key: string, data: ArrayBuffer, mimeType?: string): Promise<void>
  readFile(key: string): Promise<ArrayBuffer | null>
  getUrlForPlayback(key: string): Promise<string | null>
  deleteFile(key: string): Promise<void>
  size(): Promise<number> // bytes
  sizeByKeys(keys: string[]): Promise<number> // bytes
  isOPFSEnabled(): boolean
}

type NavigatorWithOPFS = Navigator & { storage: StorageManager & { getDirectory?: () => Promise<FileSystemDirectoryHandle> } }

function supportsOPFS(): boolean {
  if (typeof navigator === 'undefined') return false
  const n = navigator as NavigatorWithOPFS
  return !!n.storage && typeof n.storage.getDirectory === 'function'
}

function sanitizeKey(key: string): string {
  // OPFS file names cannot contain path separators; we keep the original key visible in content only
  return key.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function createInlineWriterWorker(): Worker {
  const workerSource = `
    self.onmessage = async (e) => {
      const { key, data } = e.data;
      try {
        const root = await navigator.storage.getDirectory();
        const sanitize = (k) => k.replace(/[^a-zA-Z0-9._-]/g, '_');
        const name = sanitize(key);
        const handle = await root.getFileHandle(name, { create: true });
        // Safari path: createSyncAccessHandle available only in workers
        if (typeof handle.createSyncAccessHandle === 'function') {
          const access = await handle.createSyncAccessHandle();
          try {
            await access.truncate(0);
            const chunk = new Uint8Array(data);
            access.write(chunk, { at: 0 });
            await access.flush();
          } finally {
            access.close();
          }
          self.postMessage({ ok: true });
          return;
        }
        // Fallback: if createSyncAccessHandle is missing, try createWritable
        if (typeof handle.createWritable === 'function') {
          const writable = await handle.createWritable();
          await writable.write(new Blob([data]));
          await writable.close();
          self.postMessage({ ok: true });
          return;
        }
        self.postMessage({ error: 'OPFS write methods unavailable' });
      } catch (err) {
        self.postMessage({ error: (err && err.message) ? err.message : String(err) });
      }
    };
  `
  const blob = new Blob([workerSource], { type: 'text/javascript' })
  const url = URL.createObjectURL(blob)
  const worker = new Worker(url, { type: 'module' as unknown as undefined })
  // Revoke URL when worker terminates
  const revoke = () => URL.revokeObjectURL(url)
  // @ts-expect-error - onclose not standard; best-effort cleanup
  worker.onclose = revoke
  // Also cleanup on error
  worker.onerror = () => revoke()
  return worker
}

async function opfsWriteFile(key: string, data: ArrayBuffer, mimeType?: string): Promise<void> {
  const root = await (navigator as NavigatorWithOPFS).storage.getDirectory!()
  const filename = sanitizeKey(key)
  const handle = await root.getFileHandle(filename, { create: true })
  // Chrome/Edge path
  const maybeWritable = handle as unknown as { createWritable?: () => Promise<unknown> }
  if (typeof maybeWritable.createWritable === 'function') {
    const writable = (await maybeWritable.createWritable()) as { write: (b: Blob) => Promise<void>; close: () => Promise<void> }
    await writable.write(new Blob([data], { type: mimeType }))
    await writable.close()
    return
  }
  // Safari path: use a worker + SyncAccessHandle
  await new Promise<void>((resolve, reject) => {
    const worker = createInlineWriterWorker()
    worker.onmessage = (e: MessageEvent) => {
      const { ok, error } = e.data || {}
      worker.terminate()
      if (ok) resolve()
      else reject(new Error(error || 'Failed to write via worker'))
    }
    // Transfer the ArrayBuffer to avoid copy
    worker.postMessage({ key: filename, data }, [data])
  })
}

function createInlineSizerWorker(): Worker {
  const workerSource = `
    self.onmessage = async (e) => {
      const { keys } = e.data || {};
      if (!Array.isArray(keys)) { self.postMessage({ error: 'Missing keys' }); return; }
      try {
        const root = await navigator.storage.getDirectory();
        const sanitize = (k) => k.replace(/[^a-zA-Z0-9._-]/g, '_');
        let total = 0;
        for (const raw of keys) {
          try {
            const name = sanitize(raw);
            const handle = await root.getFileHandle(name);
            const file = await handle.getFile();
            total += file.size || 0;
          } catch {}
        }
        self.postMessage({ ok: true, total });
      } catch (err) {
        self.postMessage({ error: (err && err.message) ? err.message : String(err) });
      }
    };
  `
  const blob = new Blob([workerSource], { type: 'text/javascript' })
  const url = URL.createObjectURL(blob)
  const worker = new Worker(url, { type: 'module' as unknown as undefined })
  const revoke = () => URL.revokeObjectURL(url)
  // @ts-expect-error best-effort cleanup
  worker.onclose = revoke
  worker.onerror = () => revoke()
  return worker
}

async function opfsReadFile(key: string): Promise<Blob | null> {
  try {
    const root = await (navigator as NavigatorWithOPFS).storage.getDirectory!()
    const filename = sanitizeKey(key)
    const handle = await root.getFileHandle(filename)
    const file = await handle.getFile()
    return file
  } catch {
    return null
  }
}

async function opfsDeleteFile(key: string): Promise<void> {
  try {
    const root = await (navigator as NavigatorWithOPFS).storage.getDirectory!()
    const filename = sanitizeKey(key)
    await root.removeEntry(filename, { recursive: false })
  } catch {}
}

async function opfsSize(): Promise<number> {
  try {
    const root = await (navigator as NavigatorWithOPFS).storage.getDirectory!()
    let total = 0
    // Prefer spec entries() which yields [name, handle]
    const dir = root as unknown as { entries: () => AsyncIterable<[string, FileSystemHandle]> }
    for await (const [, handle] of dir.entries()) {
      try {
        if (handle.kind === 'file') {
          const fh = handle as unknown as { getFile?: () => Promise<File> }
          if (typeof fh.getFile === 'function') {
            const file = await fh.getFile()
            total += file.size || 0
          }
        }
      } catch {}
    }
    return total
  } catch {
    return 0
  }
}

export const mediaStore: MediaStore = {
  isOPFSEnabled(): boolean {
    return supportsOPFS()
  },
  async writeFile(key, data, mimeType) {
    if (supportsOPFS()) {
      await opfsWriteFile(key, data, mimeType)
      // Best-effort request persistence once
      try {
        const lsKey = 'wavflip-storage-persist'
        if (typeof localStorage !== 'undefined' && !localStorage.getItem(lsKey)) {
          const n = navigator as Navigator & { storage?: StorageManager & { persist?: () => Promise<boolean> } }
          await n.storage?.persist?.()
          localStorage.setItem(lsKey, '1')
        }
      } catch {}
      return
    }
    // OPFS unavailable: offline media storage not supported
    throw new Error('OPFS is not available; offline media storage is unsupported on this browser')
  },
  async readFile(key) {
    if (supportsOPFS()) {
      const file = await opfsReadFile(key)
      if (!file) return null
      const buf = await file.arrayBuffer()
      return buf
    }
    return null
  },
  async getUrlForPlayback(key) {
    if (supportsOPFS()) {
      const file = await opfsReadFile(key)
      if (!file) return null
      return URL.createObjectURL(file)
    }
    return null
  },
  async deleteFile(key) {
    if (supportsOPFS()) await opfsDeleteFile(key)
  },
  async size() {
    if (supportsOPFS()) return opfsSize()
    return 0
  },
  async sizeByKeys(keys: string[]) {
    if (!supportsOPFS()) return 0
    return await new Promise<number>((resolve, reject) => {
      const worker = createInlineSizerWorker()
      worker.onmessage = (e: MessageEvent) => {
        const { ok, total, error } = e.data || {}
        worker.terminate()
        if (ok) resolve(total || 0)
        else reject(new Error(error || 'Failed to size keys'))
      }
      worker.postMessage({ keys })
    })
  },
}


