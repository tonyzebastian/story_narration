'use client';

import { useState } from 'react';

interface ContextualPromptProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function ContextualPrompt({ value, onChange, placeholder }: ContextualPromptProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onChange(localValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
  };

  return (
    <div className="border rounded-lg">
      <div className="px-4 py-3 border-b text-sm font-medium">Story Context & Guidelines</div>
      <div className="p-4 space-y-3">
        {!isEditing ? (
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {value ? (
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{value}</p>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No contextual guidelines set. Click "Edit" to add instructions that will guide all GPT edits.
                </p>
              )}
            </div>
            <button className="border rounded px-3 py-1 text-sm" onClick={() => setIsEditing(true)}>
              {value ? 'Edit' : 'Add'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              placeholder={placeholder}
              className="w-full border rounded p-2 min-h-24"
              rows={3}
            />
            <div className="flex gap-2">
              <button className="bg-black text-white rounded px-3 py-1 text-sm" onClick={handleSave}>
                Save
              </button>
              <button className="border rounded px-3 py-1 text-sm" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <strong>Examples:</strong> "Keep the tone mysterious and dark", "Write in first person",
          "Target young adult audience", "Maintain Victorian era language", etc.
        </div>
      </div>
    </div>
  );
}


