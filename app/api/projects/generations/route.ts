import { NextResponse } from 'next/server';
import { REDIS_KEYS } from '@/lib/redis';
import { getServerSession } from '@/lib/server/auth';
import { getOrCreateGenerationsProject } from '@/lib/server/vault/generations';
import { getPresignedUrl } from '@/lib/storage/s3-storage';

import type { GenerationsResponse } from '@/types/generations';

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get or create the generations project
    const generationsProject = await getOrCreateGenerationsProject(
      session.user.id
    );

    // Generate presigned URLs for all tracks
    const tracksWithUrls = await Promise.all(
      (generationsProject.tracks || []).map(async (track) => {
        if (track.activeVersion?.fileKey) {
          try {
            const cacheKey = REDIS_KEYS.presignedTrack(track.id);
            const presignedUrl = await getPresignedUrl(
              track.activeVersion.fileKey,
              cacheKey,
              60 * 60 // 1 hour
            );
            return {
              ...track,
              activeVersion: {
                ...track.activeVersion,
                presignedUrl, // Add presigned URL to the response
              },
            };
          } catch {
            return track;
          }
        }
        return track;
      })
    );

    return NextResponse.json<GenerationsResponse>({
      ...generationsProject,
      tracks: tracksWithUrls,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch generations' },
      { status: 500 }
    );
  }
}
