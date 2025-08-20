/**
 * Extract audio duration from a file using the HTML5 Audio API
 * Properly cleans up blob URLs to prevent memory leaks
 */
export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    const url = URL.createObjectURL(file);

    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration || 0);
    });

    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve(0); // Return 0 if we can't determine duration
    });

    audio.src = url;
  });
}