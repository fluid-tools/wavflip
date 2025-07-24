import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    // Verify the user is authenticated
    await requireAuth()

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        // Validate file type
        if (!pathname.match(/\.(mp3|wav|flac|m4a|aac|ogg|webm|3gp|amr)$/i)) {
          throw new Error('Invalid file type. Only audio files are allowed.')
        }

        return {
          allowedContentTypes: [
            'audio/mpeg',
            'audio/wav', 
            'audio/wave',
            'audio/x-wav',
            'audio/flac',
            'audio/x-flac', 
            'audio/mp4',
            'audio/x-m4a',
            'audio/aac',
            'audio/ogg',
            'audio/webm',
            'audio/3gpp',
            'audio/amr'
          ],
          addRandomSuffix: true, // Prevent conflicts with existing files
          tokenPayload: JSON.stringify({
            userId: (await requireAuth()).user.id,
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Upload completed:', blob.url)
        
        // Here you could add additional processing like:
        // - Extracting audio metadata
        // - Generating waveforms
        // - Creating thumbnails
        // - Virus scanning
        // etc.
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 400 }
    )
  }
} 