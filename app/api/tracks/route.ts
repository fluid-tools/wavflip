import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { createTrack, createTrackVersion } from '@/lib/library-db'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { name, projectId, fileUrl, fileSize, mimeType, duration } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Track name is required' }, { status: 400 })
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    if (!fileUrl) {
      return NextResponse.json({ error: 'File URL is required' }, { status: 400 })
    }

    // Create track
    const track = await createTrack({
      name: name.trim(),
      projectId,
      userId: session.user.id,
      order: 0,
    })

    // Create first version with the uploaded file
    await createTrackVersion({
      trackId: track.id,
      fileUrl,
      size: parseInt(fileSize) || 0,
      duration: parseFloat(duration) || 0,
      mimeType: mimeType || 'audio/mpeg',
    })

    revalidatePath(`/library-new/projects/${projectId}`)
    
    return NextResponse.json({ success: true, track })
  } catch (error) {
    console.error('Failed to create track:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create track' },
      { status: 500 }
    )
  }
} 