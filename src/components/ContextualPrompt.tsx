'use client';

import { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface ContextualPromptProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function ContextualPrompt({ value, onChange, placeholder }: ContextualPromptProps) {
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Auto-save when user clicks outside
  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  return (
    <div className="space-y-3">
      <Textarea 
        ref={textareaRef}
        value={localValue} 
        onChange={(e) => setLocalValue(e.target.value)} 
        onBlur={handleBlur}
        placeholder={placeholder || "Add story-wide guidelines and context..."} 
        rows={6}
        className="min-h-[120px] resize-none"
      />
    </div>
  );
}


