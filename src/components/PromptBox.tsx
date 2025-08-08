'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PromptBoxProps {
  position: { top: number; left: number };
  isGenerating?: boolean;
  candidateText?: string | null;
  onGenerate: (prompt: string) => void;
  onApply: () => void;
  onRetry: () => void;
  onCancel: () => void;
  isSlashMode?: boolean;
}

export default function PromptBox({ 
  position, 
  isGenerating, 
  candidateText, 
  onGenerate, 
  onApply, 
  onRetry, 
  onCancel,
  isSlashMode = false 
}: PromptBoxProps) {
  const [prompt, setPrompt] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
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
    document.addEventListener('mousedown', handleMouseDown, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClick);
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
                {isSlashMode ? 'Generate content' : 'Edit instruction'}
              </div>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={isSlashMode 
                  ? "e.g., Write a dramatic scene, add a character description, create dialogue..."
                  : "e.g., Make this more dramatic, add dialogue, simplify language..."
                }
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" onClick={handleSubmit} disabled={!prompt.trim() || isGenerating}>
                {isGenerating ? 'Generating...' : (isSlashMode ? 'Generate' : 'Generate')}
              </Button>
              <Button size="sm" variant="outline" onClick={onCancel} disabled={isGenerating}>
                Cancel
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
              <Button size="sm" onClick={onApply}>Apply</Button>
              <Button size="sm" variant="outline" onClick={onRetry} disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Retry'}
              </Button>
              <Button size="sm" variant="outline" onClick={onCancel} disabled={isGenerating}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}


