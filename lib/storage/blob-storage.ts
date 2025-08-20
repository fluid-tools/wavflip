import { del, list, put } from '@vercel/blob';
import type { AudioTrack } from '@/types/audio';

export type UploadAudioOptions = {
  filename?: string;
  contentType?: string;
  addRandomSuffix?: boolean;
};

export async function uploadAudioToBlob(
  audioBuffer: ArrayBuffer,
  options: UploadAudioOptions = {}
): Promise<{ url: string; pathname: string }> {
  const {
    filename = 'generated-audio',
    contentType = 'audio/mpeg',
    addRandomSuffix = true,
  } = options;

  // Create a unique filename with timestamp
  const timestamp = Date.now();
  const extension = getExtensionFromContentType(contentType);
  const finalFilename = addRandomSuffix
    ? `${filename}-${timestamp}.${extension}`
    : `${filename}.${extension}`;

  try {
    const blob = await put(finalFilename, audioBuffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false, // We're handling uniqueness ourselves
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
    };
  } catch (error) {
    throw new Error(
      `Failed to upload audio: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteAudioFromBlob(url: string): Promise<void> {
  try {
    await del(url);
  } catch (error) {
    throw new Error(
      `Failed to delete audio: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function listAudioFiles(prefix?: string): Promise<AudioTrack[]> {
  try {
    const { blobs } = await list({
      prefix: prefix || 'generated-audio',
      limit: 100,
    });

    return blobs.map((blob) => ({
      id: blob.pathname,
      key: blob.pathname,
      title: extractTitleFromPathname(blob.pathname),
      url: blob.url,
      createdAt: blob.uploadedAt,
      type: 'generated' as const,
      metadata: {
        prompt: 'Unknown',
        model: 'elevenlabs',
      },
    }));
  } catch {
    return [];
  }
}

function getExtensionFromContentType(contentType: string): string {
  const typeMap: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/mp4': 'm4a',
    'audio/webm': 'webm',
  };

  return typeMap[contentType] || 'mp3';
}

function extractTitleFromPathname(pathname: string): string {
  // Extract filename without extension and timestamp
  const filename = pathname.split('/').pop() || pathname;
  const nameWithoutExt = filename.split('.')[0];

  // Remove timestamp suffix if present
  const parts = nameWithoutExt.split('-');
  if (parts.length > 1 && /^\d+$/.test(parts.at(-1))) {
    parts.pop(); // Remove timestamp
  }

  return parts
    .join('-')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}
