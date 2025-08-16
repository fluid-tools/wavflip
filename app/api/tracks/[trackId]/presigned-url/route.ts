import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/auth'
import { getPresignedUrlForTrack } from '@/lib/server/vault/track'

  interface RouteParams {
  params: Promise<{
    trackId: string
  }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth()
    const { trackId } = await params

    const presignedUrl = await getPresignedUrlForTrack(trackId, {
      requireOwnerUserId: session.user.id,
      expiresInSeconds: 60 * 60,
    })
    if (!presignedUrl) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }
    return NextResponse.json({ url: presignedUrl })
  } catch (error) {
    console.error('Failed to generate presigned URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' },
      { status: 500 }
    )
  }
}