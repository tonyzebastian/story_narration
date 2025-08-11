'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Info, Loader2 } from 'lucide-react';

interface PromptBoxProps {
  position: { top: number; left: number };
  isGenerating?: boolean;
  candidateText?: string | null;
  onGenerate: (prompt: string) => void;
  onApply: () => void;
  onRetry: () => void;
  onCancel: () => void;
  isSlashMode?: boolean;
  apiKey?: string;
}

export default function PromptBox({ 
  position, 
  isGenerating, 
  candidateText, 
  onGenerate, 
  onApply, 
  onRetry, 
  onCancel,
  isSlashMode = false,
  apiKey
}: PromptBoxProps) {
  const [prompt, setPrompt] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    
    // Prevent clicks inside the popover from clearing text selection
    const handleMouseDown = (e: MouseEvent) => {
      if (cardRef.current && cardRef.current.contains(e.target as Node)) {
        e.stopPropagation();
      }
    };
    
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown, true);
    };
  }, [onCancel]);

  const handleSubmit = () => {
    if (prompt.trim()) onGenerate(prompt.trim());
  };

  return (
    <Card
      ref={cardRef as any}
      className="fixed z-50 shadow-lg w-72 md:w-80 max-w-[90vw]"
      style={{ top: position.top, left: position.left }}
      data-popover="true"
    >
      <CardContent className="p-3 space-y-3">
        {candidateText == null || isSlashMode ? (
          <>
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700">
                {isSlashMode ? 'Generate with AI' : 'Edit'}
              </div>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={isSlashMode 
                  ? "Add a witty exchange, expand on the setting, or rewrite in a suspenseful tone."
                  : "Make this punchier, soften the tone, or turn it into a question."
                }
                rows={4}
                disabled={!apiKey}
              />
              {!apiKey && (
                <div className="flex items-center gap-2 text-amber-800">
                  <Info className="h-4 w-4" />
                  <p className="text-sm">
                    Add API keys to get started.
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={onCancel} disabled={isGenerating}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={!prompt.trim() || !apiKey || isGenerating}>
                {isGenerating && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}
                {isGenerating ? 'Generating...' : (isSlashMode ? 'Generate' : 'Generate')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700">Preview</div>
              <div className="border rounded p-2 text-sm whitespace-pre-wrap bg-gray-50 max-h-64 overflow-auto">
                {candidateText}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={onCancel} disabled={isGenerating}>
                Cancel
              </Button>
              <Button size="sm" variant="outline" onClick={onRetry} disabled={isGenerating}>
                {isGenerating && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}
                {isGenerating ? 'Generating...' : 'Retry'}
              </Button>
              <Button size="sm" onClick={onApply}>Apply</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}


