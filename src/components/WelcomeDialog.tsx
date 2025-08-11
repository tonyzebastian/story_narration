'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WelcomeDialog({ open, onOpenChange }: WelcomeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md mx-4 [&>button]:hidden">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Welcome to ScriptFlow
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 leading-relaxed space-y-3">
            <p>
              ScriptFlow blends AI-powered writing assistance with ElevenLabs' lifelike voice narration, 
              so you can write, refine, and hear your story all in one place.
            </p>
            <p>
              No more juggling multiple tools. Brainstorm ideas, tweak sentences, and instantly preview them 
              in your chosen voice. Whether you're crafting a novel, a podcast script, or a YouTube voiceover, 
              ScriptFlow keeps you in the creative flow.
            </p>
            <p>
              Just add your API keys in Settings, start writing, and let AI help bring your words to life.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)} className="px-6">
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}