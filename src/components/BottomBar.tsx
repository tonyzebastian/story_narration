'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, Loader2, RotateCw, Download } from 'lucide-react';
import VoiceSelector from '@/components/VoiceSelector';
import { db } from '@/lib/database';
import type { AudioFile } from '@/types';

interface BottomBarProps {
  elevenApiKey?: string;
  selectedVoice?: string;
  onSelectVoice: (voiceId: string) => void;
  audioBlob?: Blob | null;
  onGenerateAudio: () => void;
  isGenerating?: boolean;
  storyId?: string;
  audioGenerationCount?: number;
  storyContent?: string;
}

export default function BottomBar({
  elevenApiKey,
  selectedVoice,
  onSelectVoice,
  audioBlob,
  onGenerateAudio,
  isGenerating,
  storyId,
  audioGenerationCount = 0,
  storyContent = ''
}: BottomBarProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [previousGenerations, setPreviousGenerations] = useState<AudioFile[]>([]);
  const [playingPreviousId, setPlayingPreviousId] = useState<string>('');
  const [previousAudio, setPreviousAudio] = useState<HTMLAudioElement | null>(null);
  const [previousAudioStates, setPreviousAudioStates] = useState<Record<string, boolean>>({});

  // Load previous generations
  const loadPreviousGenerations = async () => {
    if (!storyId) return;
    try {
      const audioFiles = await db.audioFiles
        .where('storyId')
        .equals(storyId)
        .toArray();

      // Sort by createdAt in descending order (newest first)
      const sortedAudioFiles = audioFiles.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      console.log('Loaded audio files:', sortedAudioFiles.length);
      setPreviousGenerations(sortedAudioFiles);
    } catch (error) {
      console.error('Failed to load previous generations:', error);
    }
  };

  useEffect(() => {
    loadPreviousGenerations();
  }, [storyId]);

  // Reload previous generations when audioGenerationCount changes
  useEffect(() => {
    if (audioGenerationCount > 0) {
      // Small delay to ensure the database write is complete
      setTimeout(() => {
        loadPreviousGenerations();
      }, 500);
    }
  }, [audioGenerationCount]);

  // Handle current audio playback
  const toggleCurrentPlayback = () => {
    if (!audioBlob) return;

    if (currentAudio) {
      if (isPlaying) {
        currentAudio.pause();
        setIsPlaying(false);
      } else {
        currentAudio.play();
        setIsPlaying(true);
      }
    } else {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.onended = () => setIsPlaying(false);
      audio.onpause = () => setIsPlaying(false);
      audio.onplay = () => setIsPlaying(true);
      setCurrentAudio(audio);
      audio.play();
      setIsPlaying(true);
    }
  };

  // Reset current audio when audioBlob changes (new generation)
  useEffect(() => {
    if (currentAudio) {
      currentAudio.pause();
      URL.revokeObjectURL(currentAudio.src);
      setCurrentAudio(null);
      setIsPlaying(false);
    }
  }, [audioBlob]);



  // Download audio file
  const downloadAudio = (audioFile: AudioFile, generationNumber: number) => {
    const url = URL.createObjectURL(audioFile.audioBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ScriptFlow-Generation-${generationNumber}-${new Date(audioFile.createdAt).toLocaleDateString().replace(/\//g, '-')}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download latest generation
  const downloadLatestGeneration = () => {
    if (previousGenerations.length > 0) {
      const latestGeneration = previousGenerations[0]; // First item is newest due to sorting
      downloadAudio(latestGeneration, previousGenerations.length);
    }
  };

  // Handle previous audio playback
  const togglePreviousAudio = (audioFile: AudioFile) => {
    const isCurrentlyPlaying = previousAudioStates[audioFile.id];

    if (isCurrentlyPlaying && previousAudio) {
      // Pause current audio
      previousAudio.pause();
      setPreviousAudioStates(prev => ({ ...prev, [audioFile.id]: false }));
      setPlayingPreviousId('');
      return;
    }

    // Stop any currently playing audio
    if (previousAudio) {
      previousAudio.pause();
      setPreviousAudioStates(prev => ({ ...prev, [playingPreviousId]: false }));
    }

    // Start new audio
    const audio = new Audio(URL.createObjectURL(audioFile.audioBlob));
    audio.onended = () => {
      setPreviousAudioStates(prev => ({ ...prev, [audioFile.id]: false }));
      setPlayingPreviousId('');
    };
    audio.onpause = () => {
      setPreviousAudioStates(prev => ({ ...prev, [audioFile.id]: false }));
    };
    audio.onplay = () => {
      setPreviousAudioStates(prev => ({ ...prev, [audioFile.id]: true }));
    };

    setPreviousAudio(audio);
    setPlayingPreviousId(audioFile.id);
    audio.play();
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        URL.revokeObjectURL(currentAudio.src);
      }
      if (previousAudio) {
        previousAudio.pause();
        URL.revokeObjectURL(previousAudio.src);
      }
    };
  }, [currentAudio, previousAudio]);

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-white">
      <div className="w-full px-4 md:px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Left: Voice Selector and Generate Button */}
          <div className="flex items-center gap-2">
            <VoiceSelector
              apiKey={elevenApiKey}
              selectedVoiceId={selectedVoice}
              onChange={onSelectVoice}
            />
            <button
              onClick={onGenerateAudio}
              disabled={isGenerating || !elevenApiKey || !storyContent.trim()}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors bg-transparent border-0 outline-none"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCw className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {isGenerating ? 'Generating...' : 'Generate'}
              </span>
            </button>
          </div>

          {/* Center: Main Play Button */}
          <div className="flex justify-center">
            <Button
              onClick={toggleCurrentPlayback}
              disabled={!audioBlob}
              className="h-12 w-12 rounded-full bg-black hover:bg-gray-800 disabled:bg-gray-300 flex items-center justify-center"
              size="sm"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6 text-white fill-white" />
              ) : (
                <Play className="h-6 w-6 text-white fill-white ml-0.5" />
              )}
            </Button>
          </div>

          {/* Right: Previous Generations */}
          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={downloadLatestGeneration}
              disabled={!audioBlob || previousGenerations.length === 0}
              className="flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
              title="Download latest generation"
            >
              <Download className="h-4 w-4" />
            </button>
            <div className="w-full max-w-[280px] relative">
              <Select
                value={playingPreviousId || ""}
                onValueChange={() => { }} // Prevent default selection behavior
                disabled={previousGenerations.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      previousGenerations.length === 0
                        ? "No previous generations"
                        : "Your previous generations"
                    }
                  >
                    {playingPreviousId && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const audioFile = previousGenerations.find(gen => gen.id === playingPreviousId);
                            if (audioFile) togglePreviousAudio(audioFile);
                          }}
                          className="flex items-center"
                        >
                          {previousAudioStates[playingPreviousId] ? (
                            <Pause className="h-3 w-3 text-gray-700" />
                          ) : (
                            <Play className="h-3 w-3 text-gray-700" />
                          )}
                        </button>
                        <span className="text-sm">
                          Generation {previousGenerations.length - previousGenerations.findIndex(gen => gen.id === playingPreviousId)}
                        </span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg">
                  {previousGenerations.map((generation, index) => (
                    <div
                      key={generation.id}
                      className="flex items-center justify-between w-full p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          Generation {previousGenerations.length - index} - {new Date(generation.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadAudio(generation, previousGenerations.length - index);
                          }}
                          className="flex items-center justify-center p-1 hover:bg-gray-200 rounded transition-colors"
                          title={`Download Generation ${previousGenerations.length - index}`}
                        >
                          <Download className="h-3 w-3 text-gray-700" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePreviousAudio(generation);
                          }}
                          className="flex items-center justify-center p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          {previousAudioStates[generation.id] ? (
                            <Pause className="h-3 w-3 text-gray-700" />
                          ) : (
                            <Play className="h-3 w-3 text-gray-700" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


