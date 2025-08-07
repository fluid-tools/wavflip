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
    const { Body, ContentLength, ContentRange, ContentType, AcceptRanges } = result
    return new Response(Body as any, {
      status: rangeHeader ? 206 : 200,
      headers: new Headers({
        'Content-Type': ContentType || '',
        'Content-Length': ContentLength?.toString() || '0',
        'Accept-Ranges': AcceptRanges || 'bytes',
        ...(ContentRange ? { 'Content-Range': ContentRange } : {}),
      }),
    })
  } catch (err) {
    console.error('audio stream error', err)
    return new Response('Internal Server Error', { status: 500 })
  }
}