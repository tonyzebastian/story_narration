'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Story Context & Guidelines</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              {value ? 'Edit' : 'Add'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea value={localValue} onChange={(e) => setLocalValue(e.target.value)} placeholder={placeholder} rows={3} />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}


