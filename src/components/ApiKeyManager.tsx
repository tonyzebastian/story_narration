'use client';

import { useState } from 'react';

interface ApiKeyManagerProps {
  initialOpenAIKey?: string;
  initialElevenLabsKey?: string;
  onSave: (openaiKey: string, elevenlabsKey: string) => void;
}

export default function ApiKeyManager({ initialOpenAIKey, initialElevenLabsKey, onSave }: ApiKeyManagerProps) {
  const [openaiKey, setOpenaiKey] = useState(initialOpenAIKey || '');
  const [elevenKey, setElevenKey] = useState(initialElevenLabsKey || '');

  return (
    <div className="border rounded p-4 space-y-3">
      <div className="text-sm font-medium">API Keys</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="password"
          placeholder="OpenAI API Key"
          value={openaiKey}
          onChange={(e) => setOpenaiKey(e.target.value)}
          className="border rounded p-2"
        />
        <input
          type="password"
          placeholder="ElevenLabs API Key"
          value={elevenKey}
          onChange={(e) => setElevenKey(e.target.value)}
          className="border rounded p-2"
        />
      </div>
      <div className="flex gap-2">
        <button className="bg-black text-white rounded px-3 py-1 text-sm w-fit" onClick={() => onSave(openaiKey, elevenKey)}>
          Save Keys
        </button>
        <button className="border rounded px-3 py-1 text-sm w-fit" onClick={() => { setOpenaiKey(''); setElevenKey(''); }}>
          Clear
        </button>
      </div>
    </div>
  );
}


