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
  // Use Web Audio API to decode and generate peaks
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const decodedAudio = await audioContext.decodeAudioData(audioBuffer.slice(0))
  
  const channelData = decodedAudio.getChannelData(0) // Mono for now
  const sampleRate = decodedAudio.sampleRate
  const duration = decodedAudio.duration
  const channels = decodedAudio.numberOfChannels
  const bits = 32 // Float32Array
  
  // Generate peaks - we'll use 1000 data points for smooth waveform
  const peaksCount = 1000
  const samplesPerPeak = Math.floor(channelData.length / peaksCount)
  const peaks: number[] = []
  
  for (let i = 0; i < peaksCount; i++) {
    const start = i * samplesPerPeak
    const end = start + samplesPerPeak
    let max = 0
    
    for (let j = start; j < end && j < channelData.length; j++) {
      const sample = Math.abs(channelData[j])
      if (sample > max) max = sample
    }
    
    peaks.push(max)
  }
  
  audioContext.close()
  
  return {
    peaks,
    duration,
    sampleRate,
    channels,
    bits
  }
}

/**
 * Generate simple placeholder waveform data based on file metadata
 */
export function generatePlaceholderWaveform(duration: number, fileSize: number): WaveformData {
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
