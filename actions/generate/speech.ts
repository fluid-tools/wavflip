"use server"

import { z } from "zod"
import { actionClient } from "@/lib/safe-action"
import { getElevenLabsClient } from "@/lib/gen-ai/elevenlabs"
import { getServerSession } from "@/lib/server/auth"
import { addGeneratedSound } from "@/lib/server/vault/generations"
import { generateFilename } from "@/lib/utils"
import { uploadGeneratedAudioToS3, getPresignedUrl } from "@/lib/storage/s3-storage"
import type { GeneratedSound } from "@/types/audio"
import type { GenerationError } from "@/types/elevenlabs"

const ttsInputSchema = z.object({
  text: z.string().min(1, "Text is required").max(2500, "Text is too long (max 2500 characters)"),
  voiceId: z.string().optional(),
})

export const generateTextToSpeech = actionClient
  .inputSchema(ttsInputSchema)
  .action(async ({ parsedInput }) => {
    const { text, voiceId } = parsedInput
    const startTime = Date.now()

    const session = await getServerSession()
    if (!session?.user?.id) throw new Error("You must be logged in to generate speech")

    try {
      const elevenLabs = getElevenLabsClient()
      const speechResponse = await elevenLabs.generateTextToSpeech({
        text: text.trim(),
        voice_id: voiceId,
        model_id: "eleven_monolingual_v1",
      })

      const filename = generateFilename(text, "speech")
      const { key } = await uploadGeneratedAudioToS3(speechResponse.audio, session.user.id, {
        filename: `speech-${filename}`,
        contentType: speechResponse.contentType,
        addRandomSuffix: true,
      })

      const generationTime = Date.now() - startTime
      const presignedUrl = await getPresignedUrl(key, undefined, 60 * 60)

      const generatedSound: GeneratedSound = {
        id: key,
        key,
        title: text.substring(0, 50) + (text.length > 50 ? "..." : ""),
        url: presignedUrl,
        createdAt: new Date(),
        type: "generated",
        metadata: {
          prompt: text.trim(),
          model: "elevenlabs-tts",
          generationTime,
        },
      }

      await addGeneratedSound(session.user.id, {
        name: generatedSound.title,
        fileKey: key,
        duration: 0,
        size: speechResponse.audio.byteLength,
        mimeType: speechResponse.contentType,
        prompt: text.trim(),
        model: "elevenlabs-tts",
      })

      return generatedSound
    } catch (error) {
      console.error("Text-to-speech generation failed:", error)
      const generationError = error as GenerationError

      if (
        generationError.code === "system_busy" ||
        generationError.code === "503" ||
        generationError.code === "429" ||
        generationError.message?.toLowerCase().includes("rate limit")
      ) {
        throw new Error("Please try again in a few moments. We are experiencing heavy traffic right now.")
      }

      throw new Error(generationError.message || "Failed to generate speech. Please try again.")
    }
  })