'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface HeaderProps {
  appName: string;
  openaiKey?: string;
  elevenlabsKey?: string;
  onSaveKeys: (openaiKey: string, elevenlabsKey: string) => void;
  onClearDatabase?: () => void;
}

export default function Header({ appName, openaiKey = '', elevenlabsKey = '', onSaveKeys, onClearDatabase }: HeaderProps) {
  const [showKeys, setShowKeys] = useState(false);
  const [oai, setOai] = useState(openaiKey);
  const [elv, setElv] = useState(elevenlabsKey);

  return (
    <header className="sticky top-0 z-20 bg-white border-b">
      <div className="w-full px-4 md:px-6 py-3 flex items-center justify-between gap-4">
        <div className="text-lg font-semibold">{appName}</div>
        <div className="flex items-center gap-2">
          {onClearDatabase && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearDatabase}
              className="text-xs"
            >
              Clear DB
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowKeys((s) => !s)}>
            API Keys
          </Button>
          {showKeys && (
            <Card className="absolute right-0 mt-2 w-[360px]">
              <CardContent className="space-y-3 p-4">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-600">OpenAI API Key</div>
                  <Input type="password" value={oai} onChange={(e) => setOai(e.target.value)} placeholder="sk-..." />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-600">ElevenLabs API Key</div>
                  <Input type="password" value={elv} onChange={(e) => setElv(e.target.value)} placeholder="eleven-..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowKeys(false)}>
                    Close
                  </Button>
                  <Button size="sm" onClick={() => { onSaveKeys(oai, elv); setShowKeys(false); }}>
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </header>
  );
}


