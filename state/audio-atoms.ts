import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { AudioTrack, PlayerState } from '@/types/audio';
import type { GeneratedSound } from '@/types/generations';

// Queue repeat modes
export type RepeatMode = 'none' | 'one' | 'all';

// Queue state interface
export type QueueState = {
  tracks: AudioTrack[];
  currentIndex: number;
  shuffleOrder?: number[];
  repeatMode: RepeatMode;
  projectId?: string; // Track which project is playing
  projectName?: string; // For display purposes
};

// Player action types
export type PlayerAction =
  | { type: 'PLAY_TRACK'; payload: AudioTrack }
  | {
      type: 'PLAY_PROJECT';
      payload: {
        tracks: AudioTrack[];
        startIndex: number;
        projectId: string;
        projectName: string;
      };
    }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'STOP' }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'SET_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_PLAYBACK_RATE'; payload: number }
  | { type: 'SET_REPEAT_MODE'; payload: RepeatMode }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'ADD_TO_QUEUE'; payload: AudioTrack }
  | { type: 'REMOVE_FROM_QUEUE'; payload: string }
  | { type: 'CLEAR_QUEUE' }
  | { type: 'REORDER_QUEUE'; payload: { from: number; to: number } }
  | { type: 'START_GENERATION' }
  | { type: 'UPDATE_GENERATION_PROGRESS'; payload: number }
  | { type: 'FINISH_GENERATION'; payload?: AudioTrack }
  | { type: 'ERROR' };

// Current playing track
export const currentTrackAtom = atom<AudioTrack | null>(null);

// Player state
export const playerStateAtom = atom<PlayerState>('idle');

// Auto-play flag for when tracks are loaded
export const autoPlayAtom = atom<boolean>(false);

// Current playback time and duration
export const currentTimeAtom = atom<number>(0);
export const durationAtom = atom<number>(0);

// Volume (0-1)
export const volumeAtom = atomWithStorage('wavflip-volume', 0.8);

// Muted state
export const mutedAtom = atom<boolean>(false);

// Playback rate
export const playbackRateAtom = atom<number>(1);

// Queue state (replaces playlistAtom)
export const queueAtom = atom<QueueState>({
  tracks: [],
  currentIndex: -1,
  repeatMode: 'none',
  projectId: undefined,
  projectName: undefined,
});

// Legacy playlist atom for backward compatibility (will be removed)
export const playlistAtom = atomWithStorage<AudioTrack[]>(
  'wavflip-playlist',
  []
);

// Generated sounds (subset of queue)
export const generatedSoundsAtom = atom<GeneratedSound[]>((get) => {
  const queue = get(queueAtom);
  return queue.tracks.filter(
    (track): track is GeneratedSound => track.type === 'generated'
  );
});

// Currently generating sound
export const isGeneratingAtom = atom<boolean>(false);

// Generation progress (0-1)
export const generationProgressAtom = atom<number>(0);

// (Deprecated) waveform peaks cache removed in favor of React Query persistence

// Buffering state for UI (distinct from general 'loading' which is for track setup)
export const isBufferingAtom = atom<boolean>(false);

/**
 * Generate a shuffle playback order that keeps the current track first.
 *
 * Strategy:
 * - Build the list of indices [0..length-1]
 * - Remove the current index (when in-bounds) so we can place it at the front
 * - Fisher–Yates shuffle the remainder for an unbiased permutation
 * - Prepend the current index back to the front (when present)
 */
function generateShuffleOrder(length: number, currentIndex: number): number[] {
  // Build an ordered list of indices
  const order = Array.from({ length }, (_, i) => i);
  const hasCurrent = currentIndex >= 0 && currentIndex < length;

  // Exclude the current index so it can be placed first later
  if (hasCurrent) {
    order.splice(currentIndex, 1);
  }

  // Unbiased shuffle of the remaining indices (Fisher–Yates)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  // Put the current track first if it exists
  if (hasCurrent) {
    order.unshift(currentIndex);
  }
  return order;
}

// Player controls actions
export const playerControlsAtom = atom(
  null,
  (get, set, action: PlayerAction) => {
    switch (action.type) {
      case 'PLAY_TRACK': {
        const queue = get(queueAtom);

        // Check if track is already in queue
        const trackIndex = queue.tracks.findIndex(
          (t) => t.id === action.payload.id
        );

        if (trackIndex !== -1) {
          // Track is in queue; mark loading and auto-play so the dock starts it when ready
          set(queueAtom, { ...queue, currentIndex: trackIndex });
          set(currentTrackAtom, action.payload);
          set(playerStateAtom, 'loading');
          set(autoPlayAtom, true);
        } else {
          // Add single track to queue and play
          set(queueAtom, {
            ...queue,
            tracks: [action.payload],
            currentIndex: 0,
            projectId: undefined,
            projectName: undefined,
          });
          set(currentTrackAtom, action.payload);
          set(playerStateAtom, 'loading');
          set(autoPlayAtom, true);
        }
        set(currentTimeAtom, 0);
        break;
      }

      case 'PLAY_PROJECT': {
        // Load entire project as queue
        const { tracks, startIndex, projectId, projectName } = action.payload;
        const newQueue: QueueState = {
          tracks,
          currentIndex: startIndex,
          repeatMode: get(queueAtom).repeatMode,
          projectId,
          projectName,
          shuffleOrder: undefined,
        };
        set(queueAtom, newQueue);

        if (tracks[startIndex]) {
          set(currentTrackAtom, tracks[startIndex]);
          set(playerStateAtom, 'loading');
          set(autoPlayAtom, true);
          set(currentTimeAtom, 0);
        }
        break;
      }

      case 'PLAY':
        set(playerStateAtom, 'playing');
        break;

      case 'PAUSE':
        set(playerStateAtom, 'paused');
        break;

      case 'STOP':
        set(playerStateAtom, 'idle');
        set(currentTimeAtom, 0);
        break;

      case 'NEXT': {
        const queueNext = get(queueAtom);
        const {
          tracks: tracksNext,
          currentIndex: currentNext,
          repeatMode,
          shuffleOrder,
        } = queueNext;

        if (tracksNext.length === 0) {
          break;
        }

        let nextIndex = currentNext;

        if (shuffleOrder) {
          // Find current position in shuffle order
          const shufflePos = shuffleOrder.indexOf(currentNext);
          if (shufflePos < shuffleOrder.length - 1) {
            nextIndex = shuffleOrder[shufflePos + 1];
          } else if (repeatMode === 'all') {
            nextIndex = shuffleOrder[0];
          }
        } else {
          // Normal order
          if (currentNext < tracksNext.length - 1) {
            nextIndex = currentNext + 1;
          } else if (repeatMode === 'all') {
            nextIndex = 0;
          }
        }

        if (nextIndex !== currentNext) {
          set(queueAtom, { ...queueNext, currentIndex: nextIndex });
          set(currentTrackAtom, tracksNext[nextIndex]);
          set(playerStateAtom, 'loading');
          set(autoPlayAtom, true);
          set(currentTimeAtom, 0);
        } else if (repeatMode === 'one') {
          // Replay current track
          set(currentTimeAtom, 0);
          set(playerStateAtom, 'playing');
        }
        break;
      }

      case 'PREVIOUS': {
        const queuePrev = get(queueAtom);
        const {
          tracks: tracksPrev,
          currentIndex: currentPrev,
          shuffleOrder: shufflePrev,
        } = queuePrev;

        if (tracksPrev.length === 0) {
          break;
        }

        // If more than 3 seconds into the track, restart it
        if (get(currentTimeAtom) > 3) {
          set(currentTimeAtom, 0);
          set(playerStateAtom, 'playing');
          break;
        }

        let prevIndex = currentPrev;

        if (shufflePrev) {
          // Find current position in shuffle order
          const shufflePos = shufflePrev.indexOf(currentPrev);
          if (shufflePos > 0) {
            prevIndex = shufflePrev[shufflePos - 1];
          } else if (queuePrev.repeatMode === 'all') {
            prevIndex = shufflePrev.at(-1) ?? currentPrev;
          }
        } else {
          // Normal order
          if (currentPrev > 0) {
            prevIndex = currentPrev - 1;
          } else if (queuePrev.repeatMode === 'all') {
            prevIndex = tracksPrev.length - 1;
          }
        }

        if (prevIndex !== currentPrev) {
          set(queueAtom, { ...queuePrev, currentIndex: prevIndex });
          set(currentTrackAtom, tracksPrev[prevIndex]);
          set(playerStateAtom, 'loading');
          set(autoPlayAtom, true);
          set(currentTimeAtom, 0);
        }
        break;
      }

      case 'SET_TIME':
        set(currentTimeAtom, action.payload);
        break;

      case 'SET_DURATION':
        set(durationAtom, action.payload);
        break;

      case 'SET_VOLUME':
        set(volumeAtom, action.payload);
        break;

      case 'TOGGLE_MUTE':
        set(mutedAtom, (prev) => !prev);
        break;

      case 'SET_PLAYBACK_RATE':
        set(playbackRateAtom, action.payload);
        break;

      case 'SET_REPEAT_MODE':
        set(queueAtom, (prev) => ({ ...prev, repeatMode: action.payload }));
        break;

      case 'TOGGLE_SHUFFLE':
        set(queueAtom, (prev) => {
          if (prev.shuffleOrder) {
            // Disable shuffle
            return { ...prev, shuffleOrder: undefined };
          }
          // Enable shuffle
          const shuffleOrder = generateShuffleOrder(
            prev.tracks.length,
            prev.currentIndex
          );
          return { ...prev, shuffleOrder };
        });
        break;

      case 'ADD_TO_QUEUE':
        set(queueAtom, (prev) => ({
          ...prev,
          tracks: [...prev.tracks, action.payload],
        }));
        break;

      case 'REMOVE_FROM_QUEUE':
        set(queueAtom, (prev) => {
          const newTracks = prev.tracks.filter(
            (track) => track.id !== action.payload
          );
          let newIndex = prev.currentIndex;

          // Adjust current index if needed
          const removedIndex = prev.tracks.findIndex(
            (t) => t.id === action.payload
          );
          if (removedIndex < prev.currentIndex) {
            newIndex = Math.max(0, prev.currentIndex - 1);
          } else if (removedIndex === prev.currentIndex) {
            // Current track was removed
            if (newTracks.length > 0) {
              newIndex = Math.min(removedIndex, newTracks.length - 1);
              set(currentTrackAtom, newTracks[newIndex]);
              set(playerStateAtom, 'loading');
              set(autoPlayAtom, true);
            } else {
              set(currentTrackAtom, null);
              set(playerStateAtom, 'idle');
            }
          }

          return {
            ...prev,
            tracks: newTracks,
            currentIndex: newTracks.length > 0 ? newIndex : -1,
          };
        });
        break;

      case 'CLEAR_QUEUE':
        set(queueAtom, {
          tracks: [],
          currentIndex: -1,
          repeatMode: get(queueAtom).repeatMode,
          projectId: undefined,
          projectName: undefined,
        });
        set(currentTrackAtom, null);
        set(playerStateAtom, 'idle');
        break;

      case 'REORDER_QUEUE': {
        const { from, to } = action.payload;
        set(queueAtom, (prev) => {
          const newTracks = [...prev.tracks];
          const [movedTrack] = newTracks.splice(from, 1);
          newTracks.splice(to, 0, movedTrack);

          // Update current index if needed
          let newIndex = prev.currentIndex;
          if (prev.currentIndex === from) {
            newIndex = to;
          } else if (from < prev.currentIndex && to >= prev.currentIndex) {
            newIndex = prev.currentIndex - 1;
          } else if (from > prev.currentIndex && to <= prev.currentIndex) {
            newIndex = prev.currentIndex + 1;
          }

          return {
            ...prev,
            tracks: newTracks,
            currentIndex: newIndex,
          };
        });
        break;
      }

      case 'START_GENERATION':
        set(isGeneratingAtom, true);
        set(generationProgressAtom, 0);
        break;

      case 'UPDATE_GENERATION_PROGRESS':
        set(generationProgressAtom, action.payload);
        break;

      case 'FINISH_GENERATION':
        set(isGeneratingAtom, false);
        set(generationProgressAtom, 0);
        if (action.payload) {
          const track = action.payload;
          set(queueAtom, (prev) => ({
            ...prev,
            tracks: [...prev.tracks, track],
          }));
        }
        break;

      case 'ERROR':
        set(playerStateAtom, 'error');
        set(isGeneratingAtom, false);
        break;
    }
  }
);

// Derived atoms for UI
export const isPlayingAtom = atom((get) => get(playerStateAtom) === 'playing');
export const isLoadingAtom = atom((get) => get(playerStateAtom) === 'loading');
export const hasCurrentTrackAtom = atom(
  (get) => get(currentTrackAtom) !== null
);

// Progress percentage (0-100)
export const progressPercentageAtom = atom((get) => {
  const currentTime = get(currentTimeAtom);
  const duration = get(durationAtom);
  return duration > 0 ? (currentTime / duration) * 100 : 0;
});

// Queue info atoms
export const hasNextTrackAtom = atom((get) => {
  const queue = get(queueAtom);
  const { tracks, currentIndex, repeatMode } = queue;

  if (tracks.length === 0) {
    return false;
  }
  if (repeatMode === 'all' || repeatMode === 'one') {
    return true;
  }

  return currentIndex < tracks.length - 1;
});

export const hasPreviousTrackAtom = atom((get) => {
  const queue = get(queueAtom);
  const { tracks, currentIndex, repeatMode } = queue;

  if (tracks.length === 0) {
    return false;
  }
  if (repeatMode === 'all') {
    return true;
  }

  return currentIndex > 0;
});

export const isShuffleEnabledAtom = atom((get) => {
  return get(queueAtom).shuffleOrder !== undefined;
});

export const repeatModeAtom = atom((get) => {
  return get(queueAtom).repeatMode;
});
