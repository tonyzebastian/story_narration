'use client';

import { useState } from 'react';

interface PromptBoxProps {
  selectedText: string;
  contextualPrompt?: string;
  onSubmit: (prompt: string) => void;
  onCancel: () => void;
}

export default function PromptBox({ selectedText, contextualPrompt, onSubmit, onCancel }: PromptBoxProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = () => {
    if (prompt.trim()) onSubmit(prompt.trim());
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-2 z-10 shadow-lg border rounded bg-white">
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Selected text:</div>
          <div className="text-sm bg-blue-50 p-2 rounded border-l-4 border-blue-200">"{selectedText}"</div>
        </div>

        {contextualPrompt && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Active guidelines:</div>
            <div className="text-xs bg-gray-50 p-2 rounded text-gray-600">{contextualPrompt}</div>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-sm font-medium">How should this text be modified?</div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'Make this more dramatic', 'Add more dialogue', 'Simplify the language', etc."
            className="w-full border rounded p-2 min-h-20"
          />
        </div>

        <div className="flex gap-2">
          <button className="bg-black text-white rounded px-3 py-1 text-sm disabled:opacity-50" onClick={handleSubmit} disabled={!prompt.trim()}>
            Apply Edit
          </button>
          <button className="border rounded px-3 py-1 text-sm" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}


