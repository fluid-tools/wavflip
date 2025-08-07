import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/server/auth'
import { getOrCreateGenerationsProject } from '@/lib/server/vault/generations'
import { getPresignedUrl } from '@/lib/storage/s3-storage'
import { REDIS_KEYS } from '@/lib/redis'

export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // Get or create the generations project
    const generationsProject = await getOrCreateGenerationsProject(session.user.id)
    
    // Generate presigned URLs for all tracks
    const tracksWithUrls = await Promise.all(
      (generationsProject.tracks || []).map(async (track) => {
        if (track.activeVersion?.fileUrl) {
          try {
            const cacheKey = REDIS_KEYS.presignedTrack(track.id)
            const presignedUrl = await getPresignedUrl(
              track.activeVersion.fileUrl, 
              cacheKey, 
              60 * 60 // 1 hour
            )
            return {
              ...track,
              activeVersion: {
                ...track.activeVersion,
                presignedUrl // Add presigned URL to the response
              }
            }
          } catch (error) {
            console.error(`Failed to generate presigned URL for track ${track.id}:`, error)
            return track
          }
        }
        return track
      })
    )
    
    return NextResponse.json({
      ...generationsProject,
      tracks: tracksWithUrls
    })
  } catch (error) {
    console.error('Failed to fetch generations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch generations' },
      { status: 500 }
    )
  }
}