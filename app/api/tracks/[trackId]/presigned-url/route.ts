import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/auth'
import { db } from '@/db'
import { track, trackVersion } from '@/db/schema/vault'
import { eq, and } from 'drizzle-orm'
import { getPresignedUrl } from '@/lib/storage/s3-storage'
import { REDIS_KEYS } from '@/lib/redis'

  interface RouteParams {
  params: Promise<{
    trackId: string
  }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth()
    const { trackId } = await params

    // Get track and verify ownership
    const [trackData] = await db
      .select()
      .from(track)
      .where(and(
        eq(track.id, trackId),
        eq(track.userId, session.user.id)
      ))
      .limit(1)

    if (!trackData) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      )
    }

    // Get active version
    if (!trackData.activeVersionId) {
      return NextResponse.json(
        { error: 'No active version for track' },
        { status: 404 }
      )
    }

    const [version] = await db
      .select()
      .from(trackVersion)
      .where(eq(trackVersion.id, trackData.activeVersionId))
      .limit(1)

    if (!version || !version.fileKey) {
      return NextResponse.json(
        { error: 'Track version not found' },
        { status: 404 }
      )
    }

    // Generate presigned URL (fileKey contains the S3 key)
    const cacheKey = REDIS_KEYS.presignedTrack(trackId)
    const presignedUrl = await getPresignedUrl(version.fileKey, cacheKey, 60 * 60) // 1 hour expiry

    return NextResponse.json({ url: presignedUrl })
  } catch (error) {
    console.error('Failed to generate presigned URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' },
      { status: 500 }
    )
  }
}