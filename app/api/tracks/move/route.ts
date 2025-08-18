import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/auth'
import { moveTrack } from '@/lib/server/vault'
import { TrackMoveFormSchema } from '@/lib/contracts/api/tracks'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const formData = await request.formData()
    const { trackId, projectId } = TrackMoveFormSchema.parse({
      trackId: formData.get('trackId'),
      projectId: formData.get('projectId'),
    })

    await moveTrack(trackId, projectId, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to move track:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to move track' },
      { status: 500 }
    )
  }
} 