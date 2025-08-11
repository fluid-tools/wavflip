/* eslint-disable no-restricted-globals */

export function isWebKit(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isSafari = /Safari\//.test(ua) && !/Chrome\//.test(ua) && !/Chromium\//.test(ua)
  const isIOS = /iPhone|iPad|iPod/.test(ua)
  return isSafari || isIOS
}

export function createSafariInlineWorker(): Worker {
  const code = `
const sanitize = (k) => String(k).replace(/[^a-zA-Z0-9._-]/g, '_');

self.onmessage = async (e) => {
  const { type, key, data, keys } = e.data || {};
  try {
    const root = await navigator.storage.getDirectory();

    if (type === 'write') {
      const handle = await root.getFileHandle(sanitize(key), { create: true });
      if (typeof handle.createSyncAccessHandle === 'function') {
        const access = await handle.createSyncAccessHandle();
        try {
          await access.truncate(0);
          const u8 = new Uint8Array(data);
          access.write(u8, { at: 0 });
          await access.flush();
        } finally { access.close(); }
        self.postMessage({ ok: true });
        return;
      }
      if (typeof handle.createWritable === 'function') {
        const w = await handle.createWritable();
        await w.write(new Blob([data]));
        await w.close();
        self.postMessage({ ok: true });
        return;
      }
      self.postMessage({ error: 'OPFS write methods unavailable' });
      return;
    }

    if (type === 'read') {
      try {
        const handle = await root.getFileHandle(sanitize(key));
        const file = await handle.getFile();
        const buf = await file.arrayBuffer();
        self.postMessage({ ok: true, data: buf, type: file.type || undefined }, [buf]);
      } catch { self.postMessage({ ok: false }); }
      return;
    }

    if (type === 'delete') {
      try { await root.removeEntry(sanitize(key), { recursive: false }); } catch {}
      self.postMessage({ ok: true });
      return;
    }

    if (type === 'sizeByKeys') {
      let total = 0;
      for (const raw of (keys || [])) {
        try {
          const name = sanitize(raw);
          const handle = await root.getFileHandle(name);
          const file = await handle.getFile();
          total += file.size || 0;
        } catch {}
      }
      self.postMessage({ ok: true, total });
      return;
    }

    if (type === 'size') {
      let total = 0;
      const iter = (root.entries && root.entries()) || root;
      for await (const entry of iter) {
        const h = Array.isArray(entry) ? entry[1] : entry;
        if (h && h.kind === 'file' && typeof h.getFile === 'function') {
          try { const f = await h.getFile(); total += f.size || 0; } catch {}
        }
      }
      self.postMessage({ ok: true, total });
      return;
    }

    self.postMessage({ error: 'Unknown op' });
  } catch (err) {
    self.postMessage({ error: String(err) });
  }
};
`
  const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }))
  const w = new Worker(url)
  const cleanup = () => URL.revokeObjectURL(url)
  // @ts-expect-error best-effort cleanup
  w.onclose = cleanup
  w.onerror = cleanup
  return w
}


