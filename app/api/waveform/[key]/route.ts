import { NextRequest, NextResponse } from 'next/server'
import { getS3AudioStream } from '@/lib/storage/s3-storage'
import { generatePlaceholderWaveform } from '@/lib/audio/waveform-generator'
import { redis, REDIS_KEYS, REDIS_TTL } from '@/lib/redis'

// use shared redis client

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params
    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid key' }, { status: 400 })
    }

    // Check cache first
    const cacheKey = REDIS_KEYS.waveform(key)
    const cached = await redis.get(cacheKey)
    if (cached) {
      console.log('cache hit', cacheKey)
      return NextResponse.json(cached)
    }

    // Get audio metadata from S3
    const result = await getS3AudioStream(key)
    if (!result) {
      return NextResponse.json({ error: 'Audio not found' }, { status: 404 })
    }

    const { ContentLength, ContentType } = result
    
    // Estimate duration based on file size and content type
    // This is a rough estimation for placeholder purposes
    let estimatedDuration = 30 // Default 30 seconds
    const fileSizeMB = (ContentLength || 0) / (1024 * 1024)
    
    if (ContentType?.includes('audio/mpeg')) {
      estimatedDuration = fileSizeMB * 60 // Rough estimate for MP3
    } else if (ContentType?.includes('audio/wav')) {
      estimatedDuration = fileSizeMB * 6 // Rough estimate for WAV
    } else if (ContentType?.includes('audio/flac')) {
      estimatedDuration = fileSizeMB * 30 // Rough estimate for FLAC
    }

    // Generate placeholder waveform
    const placeholderWaveform = generatePlaceholderWaveform(estimatedDuration, ContentLength || 0)
    
    // Cache the placeholder for 1 hour
    const response = {
      data: placeholderWaveform,
      isPlaceholder: true,
      generatedAt: new Date().toISOString(),
      key
    }
    
    await redis.setex(cacheKey, REDIS_TTL.waveform, response)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Waveform generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Background endpoint to generate actual waveform data
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params
    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid key' }, { status: 400 })
    }

    // This would be called in background to generate actual waveform
    // For now, return placeholder
    return NextResponse.json({ message: 'Background generation started' })
  } catch (error) {
    console.error('Background waveform generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
