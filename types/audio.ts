export type AudioTrack = {
  id: string;
  // S3 object key for streaming and caching
  key: string;
  title: string;
  url: string;
  duration?: number;
  waveform?: number[][];
  createdAt: Date;
  type: 'generated' | 'uploaded';
  metadata?: {
    prompt?: string;
    model?: string;
    voice?: string;
  };
};

export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export type PlayerControls = {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (progress: number) => void;
  setVolume: (volume: number) => void;
};
