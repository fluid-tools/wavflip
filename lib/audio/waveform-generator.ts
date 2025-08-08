/**
 * Waveform data generation and caching utilities
 */

export interface WaveformData {
  peaks: number[]
  duration: number
  sampleRate: number
  channels: number
  bits: number
}

export interface CachedWaveformData {
  data: WaveformData
  generatedAt: string
  key: string
}

/**
 * Generate waveform data from audio buffer
 */
export async function generateWaveformData(audioBuffer: ArrayBuffer): Promise<WaveformData> {
  // Decode
  type AudioContextCtor = new (contextOptions?: AudioContextOptions) => AudioContext
  const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor }
  const AudioContextClass: AudioContextCtor = (w.AudioContext || w.webkitAudioContext) as AudioContextCtor
  const audioContext = new AudioContextClass()
  const decoded = await audioContext.decodeAudioData(audioBuffer.slice(0))
  const sampleRate = decoded.sampleRate
  const duration = decoded.duration
  const channels = decoded.numberOfChannels
  const bits = 32

  // Pick target resolution similar to our upload flow (1000 bins)
  const peaksCount = 1000
  const totalSamples = decoded.length
  const samplesPerPeak = Math.max(1, Math.floor(totalSamples / peaksCount))

  // Compute max-absolute envelope across all channels per bin
  const channelArrays: Float32Array[] = []
  for (let c = 0; c < channels; c++) channelArrays.push(decoded.getChannelData(c))

  const peaks: number[] = new Array(peaksCount)
  for (let i = 0; i < peaksCount; i++) {
    const start = i * samplesPerPeak
    const end = Math.min(start + samplesPerPeak, totalSamples)
    let max = 0
    for (let j = start; j < end; j++) {
      let abs = 0
      // combine channels by max abs
      for (let c = 0; c < channels; c++) {
        const v = Math.abs(channelArrays[c][j])
        if (v > abs) abs = v
      }
      if (abs > max) max = abs
    }
    peaks[i] = max
  }

  // Light smoothing (3-tap moving average) to reduce spikes
  for (let i = 1; i < peaks.length - 1; i++) {
    peaks[i] = (peaks[i - 1] + peaks[i] + peaks[i + 1]) / 3
  }

  audioContext.close()

  return { peaks, duration, sampleRate, channels, bits }
}

/**
 * Generate simple placeholder waveform data
 */
export function generatePlaceholderWaveform(duration: number): WaveformData {
  // Create a simple sine wave pattern as placeholder
  const peaksCount = 1000
  const peaks: number[] = []
  
  for (let i = 0; i < peaksCount; i++) {
    // Create a more interesting pattern than flat line
    const t = i / peaksCount
    const amplitude = 0.3 + 0.2 * Math.sin(t * Math.PI * 4) + 0.1 * Math.random()
    peaks.push(Math.min(amplitude, 1))
  }
  
  return {
    peaks,
    duration,
    sampleRate: 44100,
    channels: 1,
    bits: 16
  }
}

/**
 * Normalize peaks for consistent display
 */
export function normalizePeaks(peaks: number[], targetHeight: number = 1): number[] {
  const maxPeak = Math.max(...peaks)
  if (maxPeak === 0) return peaks.map(() => 0)
  
  return peaks.map(peak => (peak / maxPeak) * targetHeight)
}

/**
 * Convert peaks to wavesurfer.js format
 */
export function peaksToWaveformData(peaks: number[]): number[] {
  return peaks.map(peak => Math.max(0, Math.min(1, peak)))
}
