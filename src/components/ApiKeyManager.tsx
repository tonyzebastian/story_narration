'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ApiKeyManagerProps {
  initialOpenAIKey?: string;
  initialElevenLabsKey?: string;
  onSave: (openaiKey: string, elevenlabsKey: string) => void;
}

export default function ApiKeyManager({ initialOpenAIKey, initialElevenLabsKey, onSave }: ApiKeyManagerProps) {
  const [openaiKey, setOpenaiKey] = useState(initialOpenAIKey || '');
  const [elevenKey, setElevenKey] = useState(initialElevenLabsKey || '');

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="text-sm font-medium">API Keys</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input type="password" placeholder="OpenAI API Key" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} />
          <Input type="password" placeholder="ElevenLabs API Key" value={elevenKey} onChange={(e) => setElevenKey(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button className="w-fit" onClick={() => onSave(openaiKey, elevenKey)}>
            Save Keys
          </Button>
          <Button variant="outline" className="w-fit" onClick={() => { setOpenaiKey(''); setElevenKey(''); }}>
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


