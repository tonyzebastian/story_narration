'use client';

import { useEffect, useState } from 'react';
import { ElevenLabsClient } from '@/lib/elevenlabs';
import type { Voice } from '@/types';
import * as SelectPrimitive from "@radix-ui/react-select";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/cn';

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

  const hasVoices = voices.length > 0;
  const isDisabled = !apiKey || isLoading || !hasVoices;

  return (
    <Select
      value={selectedVoiceId || ''}
      onValueChange={onChange}
      disabled={isDisabled}
    >
      <SelectTrigger className="w-full max-w-[200px]">
        <SelectValue placeholder={
          isLoading ? 'Loading voices...' :
            !apiKey ? 'No API key' :
              !hasVoices ? 'No voices available' :
                'Select voice'
        } />
      </SelectTrigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-white text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1"
          )}
          position="popper"
        >
          <SelectPrimitive.Viewport className="p-1 h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]">
            {voices.map((v) => (
              <SelectItem key={v.voice_id} value={v.voice_id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </Select>
  );
}


