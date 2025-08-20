import type { GeneratedSound } from './generations';

export type ElevenLabsConfig = {
  apiKey: string;
  baseUrl?: string;
};

export type SoundEffectRequest = {
  text: string;
  duration_seconds?: number;
  prompt_influence?: number;
};

export type SoundEffectResponse = {
  audio: ArrayBuffer;
  contentType: string;
};

export type TextToSpeechRequest = {
  text: string;
  voice_id?: string;
  model_id?: string;
  voice_settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
};

export type GenerationError = {
  message: string;
  code?: string;
  details?: unknown;
};

export type GenerateSoundResult = {
  success: boolean;
  data?: GeneratedSound;
  error?: string;
};
