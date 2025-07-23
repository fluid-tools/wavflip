'use server'

import { getElevenLabsClient } from '@/lib/elevenlabs'
import { uploadAudioToBlob, generateAudioFilename } from '@/lib/blob-storage'
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
    // Generate sound using ElevenLabs
    const elevenLabs = getElevenLabsClient()
    const soundResponse = await elevenLabs.generateSoundEffect({
      text: prompt.trim(),
      duration_seconds: 10,
      prompt_influence: 0.3
    })

    // Upload to Vercel Blob
    const filename = generateAudioFilename(prompt)
    const { url, pathname } = await uploadAudioToBlob(soundResponse.audio, {
      filename,
      contentType: soundResponse.contentType,
      addRandomSuffix: true
    })

    const generationTime = Date.now() - startTime

    // Create the generated sound object
    const generatedSound: GeneratedSound = {
      id: pathname,
      title: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
      url,
      createdAt: new Date(),
      type: 'generated',
      metadata: {
        prompt: prompt.trim(),
        model: 'elevenlabs-sound-effects',
        generationTime
      }
    }

    return {
      success: true,
      data: generatedSound
    }

  } catch (error) {
    console.error('Sound generation failed:', error)
    
    const generationError = error as GenerationError
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
    // Generate speech using ElevenLabs
    const elevenLabs = getElevenLabsClient()
    const speechResponse = await elevenLabs.generateTextToSpeech({
      text: text.trim(),
      voice_id: voiceId,
      model_id: 'eleven_monolingual_v1'
    })

    // Upload to Vercel Blob
    const filename = generateAudioFilename(text.substring(0, 30))
    const { url, pathname } = await uploadAudioToBlob(speechResponse.audio, {
      filename: `speech-${filename}`,
      contentType: speechResponse.contentType,
      addRandomSuffix: true
    })

    const generationTime = Date.now() - startTime

    // Create the generated sound object
    const generatedSound: GeneratedSound = {
      id: pathname,
      title: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      url,
      createdAt: new Date(),
      type: 'generated',
      metadata: {
        prompt: text.trim(),
        model: 'elevenlabs-tts',
        generationTime
      }
    }

    return {
      success: true,
      data: generatedSound
    }

  } catch (error) {
    console.error('Text-to-speech generation failed:', error)
    
    const generationError = error as GenerationError
    return {
      success: false,
      error: generationError.message || 'Failed to generate speech. Please try again.'
    }
  }
}