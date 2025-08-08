/**
 * Media storage abstraction for large audio files.
 *
 * Primary: OPFS (Origin Private File System) when available.
 * Fallback: IndexedDB via existing local-vault helpers.
 */

import { getVaultTracks, createBlobUrlFromAudioData } from '@/lib/storage/local-vault'

export interface MediaStore {
  writeFile(key: string, data: ArrayBuffer, mimeType?: string): Promise<void>
  readFile(key: string): Promise<ArrayBuffer | null>
  getUrlForPlayback(key: string): Promise<string | null>
  deleteFile(key: string): Promise<void>
  size(): Promise<number> // bytes
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

async function opfsWriteFile(key: string, data: ArrayBuffer): Promise<void> {
  const root = await (navigator as NavigatorWithOPFS).storage.getDirectory!()
  const filename = sanitizeKey(key)
  const handle = await root.getFileHandle(filename, { create: true })
  const writable = await handle.createWritable()
  await writable.write(new Blob([data]))
  await writable.close()
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
    // Prefer entries() which yields [name, handle]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const iterator: AsyncIterable<[string, FileSystemHandle]> =
      typeof (root as unknown as { entries?: () => AsyncIterable<[string, FileSystemHandle]> }).entries === 'function'
        ? ((root as unknown as { entries: () => AsyncIterable<[string, FileSystemHandle]> }).entries())
      : (async function* () {
          // Fallback to iterating root directly
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for await (const item of root as any) {
            yield item as [string, FileSystemHandle]
          }
        })()
    for await (const [, handle] of iterator) {
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
  async writeFile(key, data) {
    if (supportsOPFS()) {
      await opfsWriteFile(key, data)
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
    // Fallback: nothing to do here; IDB path is handled by local-vault helpers
  },
  async readFile(key) {
    if (supportsOPFS()) {
      const file = await opfsReadFile(key)
      if (!file) return null
      const buf = await file.arrayBuffer()
      return buf
    }
    // Fallback: read from IDB
    try {
      const tracks = await getVaultTracks()
      const found = tracks.find((t) => t.id === key || t.key === key)
      return found?.audioData ?? null
    } catch {
      return null
    }
  },
  async getUrlForPlayback(key) {
    if (supportsOPFS()) {
      const file = await opfsReadFile(key)
      if (!file) return null
      return URL.createObjectURL(file)
    }
    // Fallback: create a blob URL from IDB
    try {
      const tracks = await getVaultTracks()
      const found = tracks.find((t) => t.id === key || t.key === key)
      if (found?.audioData) return createBlobUrlFromAudioData(found.audioData)
      return null
    } catch {
      return null
    }
  },
  async deleteFile(key) {
    if (supportsOPFS()) await opfsDeleteFile(key)
  },
  async size() {
    if (supportsOPFS()) return opfsSize()
    const tracks = await getVaultTracks()
    return tracks.reduce((sum, t) => sum + (t.audioData?.byteLength ?? 0), 0)
  },
}


