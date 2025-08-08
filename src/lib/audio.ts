export function estimateAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    const url = URL.createObjectURL(blob);
    audio.src = url;
    audio.onloadedmetadata = () => {
      resolve(audio.duration || 0);
      URL.revokeObjectURL(url);
    };
  });
}


