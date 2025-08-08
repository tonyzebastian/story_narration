'use client';

import VoiceSelector from '@/components/VoiceSelector';
import AudioPlayer from '@/components/AudioPlayer';

interface BottomBarProps {
  elevenApiKey?: string;
  selectedVoice?: string;
  onSelectVoice: (voiceId: string) => void;
  audioBlob?: Blob | null;
  onGenerateAudio: () => void;
  isGenerating?: boolean;
}

export default function BottomBar({ elevenApiKey, selectedVoice, onSelectVoice, audioBlob, onGenerateAudio, isGenerating }: BottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-white">
      <div className="w-full px-4 md:px-6 py-3 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <VoiceSelector apiKey={elevenApiKey} selectedVoiceId={selectedVoice} onChange={onSelectVoice} />
        <AudioPlayer audioBlob={audioBlob || undefined} onGenerateAudio={onGenerateAudio} isGenerating={isGenerating} />
      </div>
    </div>
  );
}


