"use server"

import { z } from "zod"
import { actionClient } from "@/lib/safe-action"
import { getElevenLabsClient } from "@/lib/gen-ai/elevenlabs"
import { uploadGeneratedAudioToS3, getPresignedUrl } from "@/lib/storage/s3-storage"
import { addGeneratedSound } from "@/lib/server/vault/generations"
import { getServerSession } from "@/lib/server/auth"
import type { GeneratedSound } from "@/types/generations"
import type { GenerationError } from "@/types/elevenlabs"
import { generateFilename } from "@/lib/utils"

const soundInputSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(500, "Prompt is too long (max 500 characters)"),
  options: z
    .object({
      durationSeconds: z.number().min(0.1).max(22).optional(),
      promptInfluence: z.number().min(0).max(1).optional(),
    })
    .optional(),
})

export const generateSoundEffect = actionClient
  .inputSchema(soundInputSchema)
  .action(async ({ parsedInput }) => {
    const { prompt, options } = parsedInput
    const startTime = Date.now()

    // Auth
    const session = await getServerSession()
    if (!session?.user?.id) throw new Error("You must be logged in to generate sounds")

    try {
      // Generate sound using ElevenLabs
      const elevenLabs = getElevenLabsClient()
      const rawDuration = options?.durationSeconds
      const durationSeconds = typeof rawDuration === "number" ? Math.min(22, Math.max(0.1, rawDuration)) : 10
      const promptInfluence = typeof options?.promptInfluence === "number" ? options?.promptInfluence : 0.3

      const soundResponse = await elevenLabs.generateSoundEffect({
        text: prompt.trim(),
        duration_seconds: durationSeconds,
        prompt_influence: promptInfluence,
      })

      // Upload to S3
      const filename = generateFilename(prompt, "sound")
      const { key } = await uploadGeneratedAudioToS3(soundResponse.audio, session.user.id, {
        filename,
        contentType: soundResponse.contentType,
        addRandomSuffix: true,
      })

      const generationTime = Date.now() - startTime

      // One-hour presigned URL for immediate playback
      const presignedUrl = await getPresignedUrl(key, undefined, 60 * 60)

      const generatedSound: GeneratedSound = {
        id: key,
        key,
        title: prompt.substring(0, 50) + (prompt.length > 50 ? "..." : ""),
        url: presignedUrl,
        createdAt: new Date(),
        type: "generated",
        duration: durationSeconds,
        metadata: {
          prompt: prompt.trim(),
          model: "elevenlabs-sound-effects",
          generationTime,
        },
      }

      await addGeneratedSound(session.user.id, {
        name: generatedSound.title,
        fileKey: key,
        duration: durationSeconds,
        size: soundResponse.audio.byteLength,
        mimeType: soundResponse.contentType,
        prompt: prompt.trim(),
        model: "elevenlabs-sound-effects",
      })

      return generatedSound
    } catch (error) {
      console.error("Sound generation failed:", error)

      const generationError = error as GenerationError
      if (
        generationError.code === "system_busy" ||
        generationError.code === "503" ||
        generationError.code === "429" ||
        generationError.message?.toLowerCase().includes("rate limit")
      ) {
        throw new Error("Please try again in a few moments. We are experiencing heavy traffic right now.")
      }

      throw new Error(generationError.message || "Failed to generate sound. Please try again.")
    }
  })
