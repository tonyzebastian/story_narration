'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OpenAIClient } from '@/lib/openai';
import { Info, Loader2 } from 'lucide-react';

interface GenerateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStoryGenerated: (story: string, context: string) => void;
  apiKey?: string;
  contextualPrompt?: string;
  onContextualPromptChange?: (context: string) => void;
}

export default function GenerateStoryDialog({
  open,
  onOpenChange,
  onStoryGenerated,
  apiKey,
  contextualPrompt = '',
  onContextualPromptChange
}: GenerateStoryDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || !apiKey) return;

    setIsGenerating(true);
    try {
      const client = new OpenAIClient(apiKey);
      const story = await client.generateStory(prompt, contextualPrompt.trim() || undefined);
      onStoryGenerated(story, contextualPrompt.trim());
      onOpenChange(false);

      // Reset only the prompt, keep context
      setPrompt('');
    } catch (error) {
      console.error('Failed to generate story:', error);
      alert('Failed to generate story. Please check your API key and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancel = () => {
    setPrompt('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Generate a Story</DialogTitle>
          <DialogDescription>
            Set the tone with optional context and a clear prompt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!apiKey && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-amber-800" />
                <p className="text-sm text-amber-800">
                  Add API keys to get started.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="context">Context for AI</Label>
            <Textarea
              id="context"
              placeholder="Give AI extra context like style, tone, pacing, audience etc."
              value={contextualPrompt}
              onChange={(e) => onContextualPromptChange?.(e.target.value)}
              rows={4}
              disabled={!apiKey}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Story Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Write a short monologue introducing a time traveler's story."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              required
              disabled={!apiKey}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || !apiKey || isGenerating}
          >
            {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isGenerating ? 'Generating...' : 'Generate Story'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
