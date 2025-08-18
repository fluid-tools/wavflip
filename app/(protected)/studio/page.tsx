'use client';
import { useAtom } from 'jotai';
import { SoundGenerator } from '@/components/gen-ai/sound-gen';
import { MUSIC_PROMPTS } from '@/lib/constants/prompts';
import { currentTrackAtom } from '@/state/audio-atoms';

export default function StudioPage() {
  const [currentTrack] = useAtom(currentTrackAtom);

  return (
    <div
      className="relative h-full w-full transition-all duration-300 ease-out"
      style={{ paddingBottom: currentTrack ? '88px' : '0px' }}
    >
      {/* Scattered floating prompts */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {MUSIC_PROMPTS.slice(0, 60).map((text, i) => {
          const x = (i * 37) % 100;
          const y = (i * 23) % 100;
          const rot = ((i * 19) % 60) - 30;
          const size = 10 + ((i * 7) % 8);
          const opacity = 0.04 + (i % 5) * 0.01;
          return (
            <span
              className="absolute select-none text-muted-foreground"
              key={i}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: `rotate(${rot}deg)`,
                fontSize: `${size}px`,
                opacity,
                whiteSpace: 'nowrap',
              }}
            >
              {text}
            </span>
          );
        })}
      </div>
      <div className="relative z-10 h-full">
        <SoundGenerator />
      </div>
    </div>
  );
}
