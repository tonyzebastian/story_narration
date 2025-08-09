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
    <div className="flex flex-col h-full">
      <div className="space-y-1 mb-3 flex-shrink-0">
        <h3 className="text-sm font-medium text-gray-900">Context for AI</h3>
        <p className="text-xs text-gray-600">
          Shared as context with each request sent to OpenAI.
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <Textarea
          ref={textareaRef}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder || "Guidelines and context that will influence all AI edits"}
          className="h-full w-full resize-none text-xs tracking-wide shadow-none border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none transition-colors"
        />
      </div>
    </div>
  );
}


