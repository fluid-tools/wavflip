import type { GeneratedSound } from './generations';

export interface ElevenLabsConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface SoundEffectRequest {
  text: string;
  duration_seconds?: number;
  prompt_influence?: number;
}

export interface SoundEffectResponse {
  audio: ArrayBuffer;
  contentType: string;
}

export interface TextToSpeechRequest {
  text: string;
  voice_id?: string;
  model_id?: string;
  voice_settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

export interface GenerationError {
  message: string;
  code?: string;
  details?: any;
}

export interface GenerateSoundResult {
  success: boolean;
  data?: GeneratedSound;
  error?: string;
}
