'use client';

import { useEffect, useState } from 'react';
import { ElevenLabsClient } from '@/lib/elevenlabs';
import type { Voice } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VoiceSelectorProps {
  apiKey?: string;
  selectedVoiceId?: string;
  onChange: (voiceId: string) => void;
}

export default function VoiceSelector({ apiKey, selectedVoiceId, onChange }: VoiceSelectorProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!apiKey) return;
      setIsLoading(true);
      try {
        const el = new ElevenLabsClient(apiKey);
        const v = await el.getVoices();
        setVoices(v);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [apiKey]);

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Voice</div>
      <Select
        value={selectedVoiceId || ''}
        onValueChange={onChange}
        disabled={!apiKey || isLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={isLoading ? 'Loading...' : 'Select a voice'} />
        </SelectTrigger>
        <SelectContent>
          {voices.map((v) => (
            <SelectItem key={v.voice_id} value={v.voice_id}>
              {v.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}


