import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trackVersion } from '@/db/schema/vault';
import { generatePlaceholderWaveform } from '@/lib/audio/waveform-generator';
import { REDIS_KEYS, redis } from '@/lib/redis';
import { getS3AudioStream } from '@/lib/storage/s3-storage';

// use shared redis client
const MAX_WAVEFORM_PEAKS = 4000;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid key' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = REDIS_KEYS.waveform(key);
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get audio metadata from S3
    const result = await getS3AudioStream(key);
    if (!result) {
      return NextResponse.json({ error: 'Audio not found' }, { status: 404 });
    }

    const { ContentLength, ContentType } = result;

    // Estimate duration based on file size and content type
    // This is a rough estimation for placeholder purposes
    let estimatedDuration = 30; // Default 30 seconds
    const fileSizeMB = (ContentLength || 0) / (1024 * 1024);

    if (ContentType?.includes('audio/mpeg')) {
      estimatedDuration = fileSizeMB * 60; // Rough estimate for MP3
    } else if (ContentType?.includes('audio/wav')) {
      estimatedDuration = fileSizeMB * 6; // Rough estimate for WAV
    } else if (ContentType?.includes('audio/flac')) {
      estimatedDuration = fileSizeMB * 30; // Rough estimate for FLAC
    }

    // No real waveform found; return placeholder but DO NOT cache long-term.
    // Placeholder only when S3 metadata exists but no peaks cached yet
    const placeholderWaveform = generatePlaceholderWaveform(
      Math.max(1, Math.round(estimatedDuration))
    );
    return NextResponse.json({
      data: placeholderWaveform,
      isPlaceholder: true,
      generatedAt: new Date().toISOString(),
      key,
    });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Background endpoint to generate actual waveform data
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid key' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const { peaks, duration, sampleRate, channels } = body as {
      peaks: unknown;
      duration: unknown;
      sampleRate?: unknown;
      channels?: unknown;
    };

    if (
      !Array.isArray(peaks) ||
      peaks.length === 0 ||
      typeof duration !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Invalid waveform payload' },
        { status: 400 }
      );
    }

    // Clamp and sanitize peaks
    const sanitized = (peaks as number[])
      .slice(0, MAX_WAVEFORM_PEAKS)
      .map((v) => {
        const n = Number(v);
        if (!Number.isFinite(n)) {
          return 0;
        }
        return Math.max(0, Math.min(1, n));
      });

    const payload = {
      data: {
        peaks: sanitized,
        duration,
        sampleRate: typeof sampleRate === 'number' ? sampleRate : 44_100,
        channels: typeof channels === 'number' ? channels : 1,
        bits: 16,
      },
      isPlaceholder: false,
      generatedAt: new Date().toISOString(),
      key,
      source: 'client-upload',
    };

    await redis.set(REDIS_KEYS.waveform(key), payload);

    // Best-effort: update track_version.duration for this file key
    const numericDuration =
      typeof duration === 'number' ? duration : Number(duration);
    if (Number.isFinite(numericDuration) && numericDuration > 0) {
      try {
        await db
          .update(trackVersion)
          .set({ duration: numericDuration })
          .where(eq(trackVersion.fileKey, key));
      } catch (_e) {}
    }

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
