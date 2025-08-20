'use server';

import { z } from 'zod';
import { getElevenLabsClient } from '@/lib/gen-ai/elevenlabs';
import { actionClient } from '@/lib/safe-action';
import { getServerSession } from '@/lib/server/auth';
import { addGeneratedSound } from '@/lib/server/vault/generations';
import {
  getPresignedUrl,
  uploadGeneratedAudioToS3,
} from '@/lib/storage/s3-storage';
import { generateFilename } from '@/lib/utils';
import {
  SOUND_PROMPT_MAX_LENGTH,
  SOUND_DURATION_MIN,
  SOUND_DURATION_MAX,
  SOUND_DURATION_DEFAULT,
  PROMPT_INFLUENCE_DEFAULT,
  TITLE_PREVIEW_LENGTH,
  PRESIGNED_URL_DURATION,
} from '@/lib/constants/generation';
import type { GenerationError } from '@/types/elevenlabs';
import type { GeneratedSound } from '@/types/generations';

const soundInputSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(SOUND_PROMPT_MAX_LENGTH, `Prompt is too long (max ${SOUND_PROMPT_MAX_LENGTH} characters)`),
  options: z
    .object({
      durationSeconds: z.number().min(SOUND_DURATION_MIN).max(SOUND_DURATION_MAX).optional(),
      promptInfluence: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

export const generateSoundEffect = actionClient
  .schema(soundInputSchema)
  .action(async ({ parsedInput }) => {
    const { prompt, options } = parsedInput;
    const startTime = Date.now();

    // Auth
    const session = await getServerSession();
    if (!session?.user?.id) {
      throw new Error('You must be logged in to generate sounds');
    }

    try {
      // Generate sound using ElevenLabs
      const elevenLabs = getElevenLabsClient();
      const rawDuration = options?.durationSeconds;
      const durationSeconds =
        typeof rawDuration === 'number'
          ? Math.min(SOUND_DURATION_MAX, Math.max(SOUND_DURATION_MIN, rawDuration))
          : SOUND_DURATION_DEFAULT;
      const promptInfluence =
        typeof options?.promptInfluence === 'number'
          ? options?.promptInfluence
          : PROMPT_INFLUENCE_DEFAULT;

      const soundResponse = await elevenLabs.generateSoundEffect({
        text: prompt.trim(),
        duration_seconds: durationSeconds,
        prompt_influence: promptInfluence,
      });

      // Upload to S3
      const filename = generateFilename(prompt, 'sound');
      const { key } = await uploadGeneratedAudioToS3(
        soundResponse.audio,
        session.user.id,
        {
          filename,
          contentType: soundResponse.contentType,
          addRandomSuffix: true,
        }
      );

      const generationTime = Date.now() - startTime;

      // One-hour presigned URL for immediate playback
      const presignedUrl = await getPresignedUrl(key, undefined, PRESIGNED_URL_DURATION);

      const generatedSound: GeneratedSound = {
        id: key,
        key,
        title: prompt.substring(0, TITLE_PREVIEW_LENGTH) + (prompt.length > TITLE_PREVIEW_LENGTH ? '...' : ''),
        url: presignedUrl,
        createdAt: new Date(),
        type: 'generated',
        duration: durationSeconds,
        metadata: {
          prompt: prompt.trim(),
          model: 'elevenlabs-sound-effects',
          generationTime,
        },
      };

      await addGeneratedSound(session.user.id, {
        name: generatedSound.title,
        fileKey: key,
        duration: durationSeconds,
        size: soundResponse.audio.byteLength,
        mimeType: soundResponse.contentType,
        prompt: prompt.trim(),
        model: 'elevenlabs-sound-effects',
      });

      return generatedSound;
    } catch (error) {
      const generationError = error as GenerationError;
      if (
        generationError.code === 'system_busy' ||
        generationError.code === '503' ||
        generationError.code === '429' ||
        generationError.message?.toLowerCase().includes('rate limit')
      ) {
        throw new Error(
          'Please try again in a few moments. We are experiencing heavy traffic right now.'
        );
      }

      throw new Error(
        generationError.message || 'Failed to generate sound. Please try again.'
      );
    }
  });
