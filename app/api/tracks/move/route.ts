import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { moveTrack } from '@/server/vault'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const formData = await request.formData()
    const trackId = formData.get('trackId') as string
    const projectId = formData.get('projectId') as string

    if (!trackId || !projectId) {
      return NextResponse.json({ error: 'Track ID and Project ID are required' }, { status: 400 })
    }

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