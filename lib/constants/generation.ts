// Generation limits and constants
export const PROMPT_MAX_LENGTH = 500;
export const TTS_TEXT_MAX_LENGTH = 2500;
export const DURATION_MIN_SECONDS = 0.1;
export const DURATION_MAX_SECONDS = 22;
export const DEFAULT_DURATION_SECONDS = 10;
export const PROMPT_INFLUENCE_MIN = 0;
export const PROMPT_INFLUENCE_MAX = 1;
export const DEFAULT_PROMPT_INFLUENCE = 0.3;
export const TITLE_TRUNCATE_LENGTH = 50;
export const PRESIGNED_URL_EXPIRY_HOURS = 1;

// API limits
export const RATE_LIMIT_RETRY_DELAY_MS = 1000;

// Models
export const ELEVENLABS_SOUND_MODEL = 'elevenlabs-sound-effects';
export const ELEVENLABS_TTS_MODEL = 'eleven_monolingual_v1';