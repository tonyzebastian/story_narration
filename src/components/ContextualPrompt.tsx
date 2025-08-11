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
    <div className="h-full overflow-hidden mb-64">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-gray-900">Context for AI</h3>
      </div>
      <Textarea
        ref={textareaRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder || "Give AI extra context like style, tone, pacing, audience etc."}
        className="w-full min-h-[650px] resize-none shadow-none border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none transition-colors"

      />
    </div>
  );
}


