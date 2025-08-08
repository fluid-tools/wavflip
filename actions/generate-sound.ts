'use server'

import { getElevenLabsClient } from '@/lib/gen-ai/elevenlabs'
import { generateAudioFilename } from '@/lib/storage/blob-storage'
import { uploadGeneratedAudioToS3, getPresignedUrl } from '@/lib/storage/s3-storage'
import { addGeneratedSound } from '@/lib/server/vault/generations'
import { getServerSession } from '@/lib/server/auth'
import type { GeneratedSound } from '@/types/audio'
import type { GenerationError } from '@/types/elevenlabs'

export interface GenerateSoundResult {
  success: boolean
  data?: GeneratedSound
  error?: string
}

export async function generateSoundEffect(prompt: string): Promise<GenerateSoundResult> {
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
    const soundResponse = await elevenLabs.generateSoundEffect({
      text: prompt.trim(),
      duration_seconds: 10,
      prompt_influence: 0.3
    })

    // Upload to S3
    const filename = generateAudioFilename(prompt)
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
      duration: 0,
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

export async function generateTextToSpeech(
  text: string, 
  voiceId?: string
): Promise<GenerateSoundResult> {
  if (!text || text.trim().length === 0) {
    return {
      success: false,
      error: 'Text is required'
    }
  }

  if (text.length > 2500) {
    return {
      success: false,
      error: 'Text is too long (max 2500 characters)'
    }
  }

  const startTime = Date.now()

  try {
    // Get session first
    const session = await getServerSession()
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'You must be logged in to generate speech'
      }
    }

    // Generate speech using ElevenLabs
    const elevenLabs = getElevenLabsClient()
    const speechResponse = await elevenLabs.generateTextToSpeech({
      text: text.trim(),
      voice_id: voiceId,
      model_id: 'eleven_monolingual_v1'
    })

    // Upload to S3
    const filename = generateAudioFilename(text.substring(0, 30))
    const { key } = await uploadGeneratedAudioToS3(
      speechResponse.audio,
      session.user.id,
      {
        filename: `speech-${filename}`,
        contentType: speechResponse.contentType,
        addRandomSuffix: true
      }
    )

    const generationTime = Date.now() - startTime
    
    // Generate presigned URL for immediate playback
    const presignedUrl = await getPresignedUrl(key, undefined, 60 * 60) // 1 hour

    // Create the generated sound object with presigned URL
    const generatedSound: GeneratedSound = {
      id: key,
      key,
      title: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      url: presignedUrl, // Return presigned URL for immediate playback
      createdAt: new Date(),
      type: 'generated',
      metadata: {
        prompt: text.trim(),
        model: 'elevenlabs-tts',
        generationTime
      }
    }

    // Save to Generations project
    await addGeneratedSound(session.user.id, {
      name: generatedSound.title,
      fileKey: key, // Store S3 key
      duration: 0,
      size: speechResponse.audio.byteLength,
      mimeType: speechResponse.contentType,
      prompt: text.trim(),
      model: 'elevenlabs-tts'
    })

    return {
      success: true,
      data: generatedSound
    }

  } catch (error) {
    console.error('Text-to-speech generation failed:', error)
    
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
      error: generationError.message || 'Failed to generate speech. Please try again.'
    }
  }
}