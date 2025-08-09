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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Welcome to Story Narration
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 leading-relaxed space-y-3">
            <p>
              I built this app to explore the creative possibilities when AI writing assistance meets voice narration. 
              It's designed for writers, storytellers, and anyone who wants to bring their words to life with audio.
            </p>
            <p>
              The idea came from wanting a seamless workflow where you can craft stories with intelligent AI editing, 
              then immediately hear them narrated with high-quality voices. No switching between multiple tools or 
              complex workflows—just write, edit, and listen.
            </p>
            <p>
              Whether you're drafting a novel, creating content, or just experimenting with storytelling, 
              this app combines OpenAI's powerful language models with ElevenLabs' realistic voice synthesis 
              to make the creative process more intuitive and engaging.
            </p>
            <p className="text-xs text-gray-500 mt-4">
              Simply add your API keys in settings to get started, then begin writing or let AI help you create something new.
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