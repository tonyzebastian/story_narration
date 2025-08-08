'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface AudioPlayerProps {
  audioBlob?: Blob | null;
  onGenerateAudio: () => void;
  isGenerating?: boolean;
}

export default function AudioPlayer({ audioBlob, onGenerateAudio, isGenerating }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioBlob && audioRef.current) {
      const url = URL.createObjectURL(audioBlob);
      audioRef.current.src = url;
      return () => URL.revokeObjectURL(url);
    }
  }, [audioBlob]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
      <Button 
        variant="outline" 
        onClick={onGenerateAudio} 
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Generate Audio'}
      </Button>

      {audioBlob && (
        <>
          <Button variant="outline" onClick={togglePlayback}>
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <div className="text-sm text-gray-600">{Math.floor(currentTime)}s / {Math.floor(duration)}s</div>
        </>
      )}

      <audio
        ref={audioRef}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}


