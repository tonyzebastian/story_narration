'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, Loader2, RotateCw } from 'lucide-react';
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
  const [selectedPreviousAudio, setSelectedPreviousAudio] = useState<string>('');
  const [isPlayingPrevious, setIsPlayingPrevious] = useState(false);
  const [previousAudio, setPreviousAudio] = useState<HTMLAudioElement | null>(null);

  // Load previous generations
  const loadPreviousGenerations = async () => {
    if (!storyId) return;
    try {
      const audioFiles = await db.audioFiles
        .where('storyId')
        .equals(storyId)
        .orderBy('createdAt')
        .reverse()
        .toArray();
      console.log('Loaded audio files:', audioFiles.length);
      setPreviousGenerations(audioFiles);
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



  // Clean up audio when selection changes
  useEffect(() => {
    if (previousAudio) {
      previousAudio.pause();
      setPreviousAudio(null);
      setIsPlayingPrevious(false);
    }
  }, [selectedPreviousAudio]);

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
            <div className="w-full max-w-[280px]">
              <Select 
                value={selectedPreviousAudio} 
                onValueChange={(value) => {
                  setSelectedPreviousAudio(value);
                  // Auto-play when selecting a generation
                  setTimeout(() => {
                    const selectedAudioFile = previousGenerations.find(gen => gen.id === value);
                    if (selectedAudioFile) {
                      if (previousAudio) {
                        previousAudio.pause();
                        setPreviousAudio(null);
                      }
                      const audio = new Audio(URL.createObjectURL(selectedAudioFile.audioBlob));
                      audio.onended = () => setIsPlayingPrevious(false);
                      audio.onpause = () => setIsPlayingPrevious(false);
                      audio.onplay = () => setIsPlayingPrevious(true);
                      setPreviousAudio(audio);
                      audio.play();
                      setIsPlayingPrevious(true);
                    }
                  }, 100);
                }}
                disabled={previousGenerations.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={
                    previousGenerations.length === 0 
                      ? "No previous generations" 
                      : "Previous generations"
                  } />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg">
                  {previousGenerations.map((generation, index) => (
                    <SelectItem 
                      key={generation.id} 
                      value={generation.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Play className="h-3 w-3 text-gray-500" />
                        <span>
                          Generation {previousGenerations.length - index} - {new Date(generation.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPreviousAudio && (
              <div className="text-xs text-gray-500">
                {isPlayingPrevious ? 'Playing...' : 'Paused'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


