import { type NextRequest, NextResponse } from 'next/server';
import { requireAuthApi } from '@/lib/server/auth';
import { getPresignedUrlForTrack } from '@/lib/server/vault/track';
import { logger } from '@/lib/logger';

type RouteParams = {
  params: Promise<{
    trackId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    // Require authentication
    const authResult = await requireAuthApi();
    if (authResult.error) {
      return authResult.response;
    }

    const { session } = authResult;
    const { trackId } = await params;

    logger.apiRequest('GET', `/api/tracks/${trackId}/presigned-url`, {
      userId: session.user.id,
      trackId,
    });

    const presignedUrl = await getPresignedUrlForTrack(trackId, {
      requireOwnerUserId: session.user.id,
      expiresInSeconds: 60 * 60,
    });

    if (!presignedUrl) {
      logger.apiResponse('GET', `/api/tracks/${trackId}/presigned-url`, 404, {
        userId: session.user.id,
        trackId,
        error: 'Track not found',
      });
      return NextResponse.json(
        { 
          success: false,
          error: 'Track not found' 
        }, 
        { status: 404 }
      );
    }

    logger.apiResponse('GET', `/api/tracks/${trackId}/presigned-url`, 200, {
      userId: session.user.id,
      trackId,
    });

    return NextResponse.json({ 
      success: true,
      url: presignedUrl 
    });
  } catch (error) {
    const { trackId } = await params;
    logger.apiError('GET', `/api/tracks/${trackId}/presigned-url`, error as Error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate presigned URL' 
      },
      { status: 500 }
    );
  }
}
