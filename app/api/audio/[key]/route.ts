import type { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { track, trackVersion } from '@/db/schema/vault';
import { requireAuthApi } from '@/lib/server/auth';
import { getS3AudioStream } from '@/lib/storage/s3-storage';
import { logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    if (!key || typeof key !== 'string') {
      logger.apiResponse('GET', `/api/audio/${key}`, 400, { error: 'Missing or invalid key' });
      return new Response('Missing or invalid key', { status: 400 });
    }

    // Require authentication
    const authResult = await requireAuthApi();
    if (authResult.error) {
      return authResult.response;
    }

    const { session } = authResult;

    // Verify the user owns a track that uses this file key
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
      logger.apiResponse('GET', `/api/audio/${key}`, 404, { 
        userId: session.user.id,
        error: 'Track not found for key'
      });
      return new Response('Not found', { status: 404 });
    }

    // Check ownership or public access
    const hasAccess = 
      trackOwnership.userId === session.user.id || 
      trackOwnership.accessType === 'public';

    if (!hasAccess) {
      logger.apiResponse('GET', `/api/audio/${key}`, 403, { 
        userId: session.user.id,
        trackUserId: trackOwnership.userId,
        accessType: trackOwnership.accessType,
        error: 'Access denied'
      });
      return new Response('Forbidden', { status: 403 });
    }

    logger.apiRequest('GET', `/api/audio/${key}`, { 
      userId: session.user.id,
      trackId: trackOwnership.trackId 
    });

    const rangeHeader = req.headers.get('range') || undefined;
    const result = await getS3AudioStream(key, rangeHeader);

    if (!result) {
      logger.apiResponse('GET', `/api/audio/${key}`, 404, { error: 'File not found in storage' });
      return new Response('Not found', { status: 404 });
    }

    const { Body, ContentLength, ContentRange, ContentType } = result;

    // Ensure we're actually streaming and not buffering
    const headers = new Headers({
      'Content-Type': ContentType || 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
    });

    if (rangeHeader) {
      // Range request - return 206 Partial Content
      headers.set('Content-Range', ContentRange || '');
      headers.set('Content-Length', ContentLength?.toString() || '0');

      logger.apiResponse('GET', `/api/audio/${key}`, 206, { 
        contentLength: ContentLength,
        range: rangeHeader 
      });

      return new Response(Body as ReadableStream, {
        status: 206,
        headers,
      });
    }
    // Full request - still allow streaming
    headers.set('Content-Length', ContentLength?.toString() || '0');

    logger.apiResponse('GET', `/api/audio/${key}`, 200, { 
      contentLength: ContentLength 
    });

    return new Response(Body as ReadableStream, {
      status: 200,
      headers,
    });
  } catch (error) {
    logger.apiError('GET', `/api/audio/${await params.then(p => p.key)}`, error as Error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
