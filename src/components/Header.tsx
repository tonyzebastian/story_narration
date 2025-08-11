'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Undo2, Redo2, Settings, Twitter, Github, X } from 'lucide-react';

interface HeaderProps {
  appName: string;
  openaiKey?: string;
  elevenlabsKey?: string;
  onSaveKeys: (openaiKey: string, elevenlabsKey: string) => void;
  onClearDatabase?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onGoBack?: () => void;
  onGoForward?: () => void;
  onShowWelcome?: () => void;
}

export default function Header({ 
  appName, 
  openaiKey = '', 
  elevenlabsKey = '', 
  onSaveKeys, 
  onClearDatabase,
  canGoBack = false,
  canGoForward = false,
  onGoBack,
  onGoForward,
  onShowWelcome
}: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [oai, setOai] = useState(openaiKey);
  const [elv, setElv] = useState(elevenlabsKey);
  const [showToast, setShowToast] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync local state with props when they change
  useEffect(() => {
    setOai(openaiKey);
  }, [openaiKey]);

  useEffect(() => {
    setElv(elevenlabsKey);
  }, [elevenlabsKey]);

  // Auto-save API keys when they change
  useEffect(() => {
    if (oai !== openaiKey || elv !== elevenlabsKey) {
      onSaveKeys(oai, elv);
    }
  }, [oai, elv]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSettings]);

  return (
    <header className="sticky top-0 z-20 bg-white border-b">
      <div className="w-full px-4 md:px-6 py-3 flex items-center justify-between gap-4">
        <button 
          onClick={onShowWelcome}
          className="text-lg font-semibold hover:text-gray-700 transition-colors cursor-pointer"
        >
          {appName}
        </button>
        <div className="flex items-center gap-2 relative">
          {/* Version Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={onGoBack}
              disabled={!canGoBack}
              className="p-1 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
              title="Undo"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              onClick={onGoForward}
              disabled={!canGoForward}
              className="p-1 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
              title="Redo"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>
          
          {/* Settings Button */}
          <Button variant="outline" size="sm" onClick={() => setShowSettings((s) => !s)}>
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
          
          {/* Twitter Link */}
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://x.com/tonyzeb_design"
              target="_blank"
              rel="noopener noreferrer"
              title="Follow on Twitter"
            >
              <Twitter className="h-4 w-4" />
            </a>
          </Button>
          
          {/* GitHub Link */}
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://github.com/tonyzebastian/story_narration"
              target="_blank"
              rel="noopener noreferrer"
              title="View on GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
          </Button>
          
          {showSettings && (
            <Card ref={popoverRef} className="absolute top-full right-0 mt-2 w-[400px] z-50 shadow-lg">
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">Settings</div>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                {/* API Keys Section */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-gray-600">OpenAI API Key</div>
                      <Input 
                        type="password" 
                        value={oai} 
                        onChange={(e) => setOai(e.target.value)} 
                        placeholder="sk-..." 
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-gray-600">ElevenLabs API Key</div>
                      <Input 
                        type="password" 
                        value={elv} 
                        onChange={(e) => setElv(e.target.value)} 
                        placeholder="eleven-..." 
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                {onClearDatabase && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to clear all data and API keys? This action cannot be undone.')) {
                          setOai('');
                          setElv('');
                          onClearDatabase();
                          setShowSettings(false);
                          setShowToast(true);
                          setTimeout(() => setShowToast(false), 3000);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Data
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gray-900 text-white px-4 py-2 rounded-md shadow-lg">
            All data and API keys are removed
          </div>
        </div>
      )}
    </header>
  );
}


