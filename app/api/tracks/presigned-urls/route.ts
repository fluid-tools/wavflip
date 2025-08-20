import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthApi } from '@/lib/server/auth';
import { getPresignedUrlForTrack } from '@/lib/server/vault/track';
import { logger } from '@/lib/logger';

// Request schema for batch presigned URLs
const batchPresignedUrlSchema = z.object({
  trackIds: z.array(z.string().min(1)).min(1).max(100), // Limit to 100 URLs per request
  expiresInSeconds: z.number().min(60).max(24 * 60 * 60).default(60 * 60), // 1 minute to 24 hours
});

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuthApi();
    if (authResult.error) {
      return authResult.response;
    }

    const { session } = authResult;

    // Parse and validate request body
    const body = await request.json().catch(() => null);
    const parseResult = batchPresignedUrlSchema.safeParse(body);

    if (!parseResult.success) {
      logger.apiResponse('POST', '/api/tracks/presigned-urls', 400, {
        userId: session.user.id,
        error: 'Invalid request body',
        validationErrors: parseResult.error.errors,
      });
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid request body',
          details: parseResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { trackIds, expiresInSeconds } = parseResult.data;

    logger.apiRequest('POST', '/api/tracks/presigned-urls', {
      userId: session.user.id,
      trackCount: trackIds.length,
      expiresInSeconds,
    });

    // Generate presigned URLs for all tracks in parallel
    const urlPromises = trackIds.map(async (trackId) => {
      try {
        const presignedUrl = await getPresignedUrlForTrack(trackId, {
          requireOwnerUserId: session.user.id,
          expiresInSeconds,
        });

        return {
          trackId,
          success: true,
          url: presignedUrl,
        };
      } catch (error) {
        logger.error(`Failed to generate presigned URL for track ${trackId}`, {
          userId: session.user.id,
          trackId,
        }, error as Error);

        return {
          trackId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    const results = await Promise.all(urlPromises);

    // Separate successful and failed results
    const successful = results.filter(r => r.success && r.url);
    const failed = results.filter(r => !r.success || !r.url);

    // Create URL map for successful results
    const urlMap = Object.fromEntries(
      successful.map(r => [r.trackId, r.url])
    );

    // Create error map for failed results
    const errorMap = Object.fromEntries(
      failed.map(r => [r.trackId, r.error || 'Track not found or access denied'])
    );

    const response = {
      success: true,
      urls: urlMap,
      errors: errorMap,
      statistics: {
        requested: trackIds.length,
        successful: successful.length,
        failed: failed.length,
      },
    };

    logger.apiResponse('POST', '/api/tracks/presigned-urls', 200, {
      userId: session.user.id,
      requested: trackIds.length,
      successful: successful.length,
      failed: failed.length,
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.apiError('POST', '/api/tracks/presigned-urls', error as Error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Add GET method for documentation/health check
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/tracks/presigned-urls',
    method: 'POST',
    description: 'Generate presigned URLs for multiple tracks',
    schema: {
      trackIds: 'array of track IDs (1-100 items)',
      expiresInSeconds: 'optional expiration time (60-86400 seconds, default: 3600)',
    },
    example: {
      trackIds: ['track1', 'track2', 'track3'],
      expiresInSeconds: 3600,
    },
  });
}