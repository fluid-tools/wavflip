'use server'

import { getElevenLabsClient } from '@/lib/gen-ai/elevenlabs'
import { uploadGeneratedAudioToS3, getPresignedUrl } from '@/lib/storage/s3-storage'
import { addGeneratedSound } from '@/lib/server/vault/generations'
import { getServerSession } from '@/lib/server/auth'
import type { GeneratedSound } from '@/types/audio'
import type { GenerationError, GenerateSoundResult } from '@/types/elevenlabs'
import { generateFilename } from '@/lib/utils'

export async function generateSoundEffect(
  prompt: string,
  options?: { durationSeconds?: number; promptInfluence?: number }
): Promise<GenerateSoundResult> {
  if (!prompt || prompt.trim().length === 0) {
    return {
      success: false,
      error: 'Prompt is required'
    }
  }

  if (prompt.length > 500) {
    return {
      success: false,
      error: 'Prompt is too long (max 500 characters)'
    }
  }

  const startTime = Date.now()

  try {
    // Get session first to check if user is authenticated
    const session = await getServerSession()
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'You must be logged in to generate sounds'
      }
    }

    // Generate sound using ElevenLabs
    const elevenLabs = getElevenLabsClient()
    const rawDuration = options?.durationSeconds
    // Clamp per ElevenLabs docs: 0.1 to 22 seconds
    const durationSeconds = typeof rawDuration === 'number'
      ? Math.min(22, Math.max(0.1, rawDuration))
      : 10
    const promptInfluence = typeof options?.promptInfluence === 'number' ? options?.promptInfluence : 0.3
    const soundResponse = await elevenLabs.generateSoundEffect({
      text: prompt.trim(),
      duration_seconds: durationSeconds,
      prompt_influence: promptInfluence
    })

    // Upload to S3
    const filename = generateFilename(prompt, 'sound')
    const { key } = await uploadGeneratedAudioToS3(
      soundResponse.audio, 
      session.user.id,
      {
        filename,
        contentType: soundResponse.contentType,
        addRandomSuffix: true
      }
    )

    const generationTime = Date.now() - startTime
    
    // Generate presigned URL for immediate playback
    const presignedUrl = await getPresignedUrl(key, undefined, 60 * 60) // 1 hour

    // Create the generated sound object with presigned URL for immediate use
    const generatedSound: GeneratedSound = {
      id: key,
      key,
      title: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
      url: presignedUrl, // Return presigned URL for immediate playback
      createdAt: new Date(),
      type: 'generated',
      duration: durationSeconds,
      metadata: {
        prompt: prompt.trim(),
        model: 'elevenlabs-sound-effects',
        generationTime
      }
    }

    // Save to Generations project (use estimated duration if available in response headers; fallback to 0)
    await addGeneratedSound(session.user.id, {
      name: generatedSound.title,
      fileKey: key, // Store S3 key
      duration: durationSeconds,
      size: soundResponse.audio.byteLength,
      mimeType: soundResponse.contentType,
      prompt: prompt.trim(),
      model: 'elevenlabs-sound-effects'
    })

    return {
      success: true,
      data: generatedSound
    }

  } catch (error) {
    console.error('Sound generation failed:', error)
    
    const generationError = error as GenerationError
    
    // Handle rate limiting with user-friendly message
    if (generationError.code === 'system_busy' || 
        generationError.code === '503' ||
        generationError.code === '429' ||
        generationError.message?.toLowerCase().includes('rate limit')) {
      return {
        success: false,
        error: 'Please try again in a few moments. We are experiencing heavy traffic right now.'
      }
    }

    return {
      success: false,
      error: generationError.message || 'Failed to generate sound. Please try again.'
    }
  }
}
