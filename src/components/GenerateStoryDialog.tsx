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

interface GenerateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStoryGenerated: (story: string, context: string) => void;
  apiKey?: string;
}

export default function GenerateStoryDialog({ 
  open, 
  onOpenChange, 
  onStoryGenerated, 
  apiKey 
}: GenerateStoryDialogProps) {
  const [context, setContext] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || !apiKey) return;
    
    setIsGenerating(true);
    try {
      const client = new OpenAIClient(apiKey);
      const story = await client.generateStory(prompt, context.trim() || undefined);
      onStoryGenerated(story, context.trim());
      onOpenChange(false);
      
      // Reset form
      setContext('');
      setPrompt('');
    } catch (error) {
      console.error('Failed to generate story:', error);
      alert('Failed to generate story. Please check your API key and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancel = () => {
    setContext('');
    setPrompt('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Generate a Basic Story with AI</DialogTitle>
          <DialogDescription>
            Provide context and guidelines for your story, then enter your prompt to generate a story.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="context">Story Context and Guidelines (Optional, but recommended)</Label>
            <Textarea
              id="context"
              placeholder="Enter any context, guidelines, or specific requirements for your story..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="prompt">Story Prompt *</Label>
            <Textarea
              id="prompt"
              placeholder="Enter your story prompt here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              required
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
            {isGenerating ? 'Generating...' : 'Generate Story'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
