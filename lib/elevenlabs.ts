import type { 
  ElevenLabsConfig, 
  SoundEffectRequest, 
  SoundEffectResponse, 
  TextToSpeechRequest,
  GenerationError 
} from '@/types/elevenlabs'

class ElevenLabsClient {
  private apiKey: string
  private baseUrl: string

  constructor(config: ElevenLabsConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || 'https://api.elevenlabs.io'
  }

  private async makeRequest(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const error: GenerationError = {
        message: errorData.detail?.message || `HTTP ${response.status}: ${response.statusText}`,
        code: errorData.detail?.status || response.status.toString(),
        details: errorData
      }
      throw error
    }

    return response
  }

  async generateSoundEffect(request: SoundEffectRequest): Promise<SoundEffectResponse> {
    try {
      const response = await this.makeRequest('/v1/sound-generation', {
        method: 'POST',
        body: JSON.stringify({
          text: request.text,
          duration_seconds: request.duration_seconds || 10,
          prompt_influence: request.prompt_influence || 0.3
        })
      })

      const audioBuffer = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') || 'audio/mpeg'

      return {
        audio: audioBuffer,
        contentType
      }
    } catch (error) {
      if (error instanceof Error) {
        throw {
          message: `Sound generation failed: ${error.message}`,
          code: 'GENERATION_ERROR',
          details: error
        } as GenerationError
      }
      throw error
    }
  }

  async generateTextToSpeech(request: TextToSpeechRequest): Promise<SoundEffectResponse> {
    try {
      const voiceId = request.voice_id || 'pNInz6obpgDQGcFmaJgB' // Default voice
      
      const response = await this.makeRequest(`/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        body: JSON.stringify({
          text: request.text,
          model_id: request.model_id || 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: true,
            ...request.voice_settings
          }
        })
      })

      const audioBuffer = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') || 'audio/mpeg'

      return {
        audio: audioBuffer,
        contentType
      }
    } catch (error) {
      if (error instanceof Error) {
        throw {
          message: `Text-to-speech generation failed: ${error.message}`,
          code: 'TTS_ERROR',
          details: error
        } as GenerationError
      }
      throw error
    }
  }

  async getVoices() {
    try {
      const response = await this.makeRequest('/v1/voices')
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch voices:', error)
      return { voices: [] }
    }
  }
}

// Singleton instance
let elevenLabsClient: ElevenLabsClient | null = null

export function getElevenLabsClient(): ElevenLabsClient {
  if (!elevenLabsClient) {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY environment variable is not set')
    }
    
    elevenLabsClient = new ElevenLabsClient({ apiKey })
  }
  
  return elevenLabsClient
}

export { ElevenLabsClient }