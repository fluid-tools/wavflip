import { NextRequest } from 'next/server'
import { getS3AudioStream } from '@/lib/storage/s3-storage'

export async function GET(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  try {
    const { key } = await params
    if (!key || typeof key !== 'string') {
      return new Response('Missing or invalid key', { status: 400 })
    }
    
    const rangeHeader = req.headers.get('range') || undefined
    const result = await getS3AudioStream(key, rangeHeader)
    
    if (!result) {
      return new Response('Not found', { status: 404 })
    }
    
    const { Body, ContentLength, ContentRange, ContentType } = result
    
    // Ensure we're actually streaming and not buffering
    const headers = new Headers({
      'Content-Type': ContentType || 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
    })
    
    if (rangeHeader) {
      // Range request - return 206 Partial Content
      headers.set('Content-Range', ContentRange || '')
      headers.set('Content-Length', ContentLength?.toString() || '0')
      
      return new Response(Body as ReadableStream, {
        status: 206,
        headers,
      })
    } else {
      // Full request - still allow streaming
      headers.set('Content-Length', ContentLength?.toString() || '0')
      
      return new Response(Body as ReadableStream, {
        status: 200,
        headers,
      })
    }
  } catch (err) {
    console.error('audio stream error', err)
    return new Response('Internal Server Error', { status: 500 })
  }
}