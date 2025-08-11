'use server'

import { getElevenLabsClient } from "@/lib/gen-ai/elevenlabs"
import { getServerSession } from "@/lib/server/auth"
import { addGeneratedSound } from "@/lib/server/vault/generations"
import { generateFilename } from "@/lib/utils"
import { uploadGeneratedAudioToS3, getPresignedUrl } from "@/lib/storage/s3-storage"
import type { GeneratedSound } from "@/types/audio"
import type { GenerationError, GenerateSoundResult } from "@/types/elevenlabs"

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
        const filename = generateFilename(text, 'speech')
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