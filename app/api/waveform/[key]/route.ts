import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { track, trackVersion } from '@/db/schema/vault';
import { generatePlaceholderWaveform } from '@/lib/audio/waveform-generator';
import { logger } from '@/lib/logger';
import { REDIS_KEYS, REDIS_TTL, redis } from '@/lib/redis';
import { requireAuthApi } from '@/lib/server/auth';
import { getS3AudioStream } from '@/lib/storage/s3-storage';

// use shared redis client
const MAX_WAVEFORM_PEAKS = 4000;

/**
 * Verify that the user has access to the track with the given file key
 */
async function verifyTrackAccess(key: string, userId: string) {
  const [trackOwnership] = await db
    .select({
      trackId: track.id,
      userId: track.userId,
      accessType: track.accessType,
    })
    .from(trackVersion)
    .innerJoin(track, eq(track.id, trackVersion.trackId))
    .where(eq(trackVersion.fileKey, key))
    .limit(1);

  if (!trackOwnership) {
    return { hasAccess: false, error: 'Track not found for key' };
  }

  // Check ownership or public access
  const hasAccess = 
    trackOwnership.userId === userId || 
    trackOwnership.accessType === 'public';

  if (!hasAccess) {
    return { 
      hasAccess: false, 
      error: 'Access denied',
      trackUserId: trackOwnership.userId,
      accessType: trackOwnership.accessType,
    };
  }

  return { hasAccess: true, trackId: trackOwnership.trackId };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    if (!key || typeof key !== 'string') {
      logger.apiResponse('GET', `/api/waveform/${key}`, 400, { error: 'Missing or invalid key' });
      return NextResponse.json(
        { error: 'Missing or invalid key' },
        { status: 400 }
      );
    }

    // Require authentication
    const authResult = await requireAuthApi();
    if (authResult.error) {
      return authResult.response;
    }

    const { session } = authResult;

    // Verify track access
    const accessResult = await verifyTrackAccess(key, session.user.id);
    if (!accessResult.hasAccess) {
      logger.apiResponse('GET', `/api/waveform/${key}`, 403, {
        userId: session.user.id,
        error: accessResult.error,
        trackUserId: accessResult.trackUserId,
        accessType: accessResult.accessType,
      });
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    logger.apiRequest('GET', `/api/waveform/${key}`, { 
      userId: session.user.id,
      trackId: accessResult.trackId 
    });

    // Check cache first
    const cacheKey = REDIS_KEYS.waveform(key);
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.apiResponse('GET', `/api/waveform/${key}`, 200, { source: 'cache' });
      return NextResponse.json(cached);
    }

    // Get audio metadata from S3
    const result = await getS3AudioStream(key);
    if (!result) {
      logger.apiResponse('GET', `/api/waveform/${key}`, 404, { error: 'Audio not found in storage' });
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

    logger.apiResponse('GET', `/api/waveform/${key}`, 200, { 
      source: 'placeholder', 
      estimatedDuration,
      fileSizeMB 
    });

    return NextResponse.json({
      data: placeholderWaveform,
      isPlaceholder: true,
      generatedAt: new Date().toISOString(),
      key,
    });
  } catch (error) {
    logger.apiError('GET', `/api/waveform/${await params.then(p => p.key)}`, error as Error);
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
      logger.apiResponse('POST', `/api/waveform/${key}`, 400, { error: 'Missing or invalid key' });
      return NextResponse.json(
        { error: 'Missing or invalid key' },
        { status: 400 }
      );
    }

    // Require authentication
    const authResult = await requireAuthApi();
    if (authResult.error) {
      return authResult.response;
    }

    const { session } = authResult;

    // Verify track access
    const accessResult = await verifyTrackAccess(key, session.user.id);
    if (!accessResult.hasAccess) {
      logger.apiResponse('POST', `/api/waveform/${key}`, 403, {
        userId: session.user.id,
        error: accessResult.error,
        trackUserId: accessResult.trackUserId,
        accessType: accessResult.accessType,
      });
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    logger.apiRequest('POST', `/api/waveform/${key}`, { 
      userId: session.user.id,
      trackId: accessResult.trackId 
    });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      logger.apiResponse('POST', `/api/waveform/${key}`, 400, { error: 'Invalid body' });
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
      logger.apiResponse('POST', `/api/waveform/${key}`, 400, { error: 'Invalid waveform payload' });
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

    // Add TTL to waveform cache as requested
    await redis.set(REDIS_KEYS.waveform(key), payload, { ex: REDIS_TTL.waveform });

    // Best-effort: update track_version.duration for this file key
    const numericDuration =
      typeof duration === 'number' ? duration : Number(duration);
    if (Number.isFinite(numericDuration) && numericDuration > 0) {
      try {
        await db
          .update(trackVersion)
          .set({ duration: numericDuration })
          .where(eq(trackVersion.fileKey, key));
        
        logger.dbQuery('UPDATE track_version duration', { 
          key, 
          duration: numericDuration 
        });
      } catch (error) {
        logger.dbError('UPDATE track_version duration', error as Error, { 
          key, 
          duration: numericDuration 
        });
      }
    }

    logger.apiResponse('POST', `/api/waveform/${key}`, 200, { 
      duration,
      peaksCount: sanitized.length,
      cached: true 
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.apiError('POST', `/api/waveform/${await params.then(p => p.key)}`, error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
