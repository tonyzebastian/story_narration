'use client';

import { useCallback, useRef, useState } from 'react';
import ContextualPrompt from '@/components/ContextualPrompt';
import PromptBox from '@/components/PromptBox';
import { OpenAIClient } from '@/lib/openai';

interface StoryEditorProps {
  story: { id: string; content: string; contextualPrompt?: string };
  onStoryUpdate: (
    newContent: string,
    meta: { type: string; prompt?: string; editedRange?: { start: number; end: number }; contextualPrompt?: string },
  ) => Promise<void> | void;
  openaiApiKey?: string;
}

export default function StoryEditor({ story, onStoryUpdate, openaiApiKey }: StoryEditorProps) {
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [showPrompt, setShowPrompt] = useState(false);
  const [contextualPrompt, setContextualPrompt] = useState<string>(story.contextualPrompt || '');
  const editorRef = useRef<HTMLDivElement>(null);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() && editorRef.current) {
      const text = selection.toString();
      const range = selection.getRangeAt(0);
      const start = getTextOffset(editorRef.current, range.startContainer, range.startOffset);
      const end = start + text.length;
      setSelectedText(text);
      setSelectionRange({ start, end });
      setShowPrompt(true);
    }
  }, []);

  const handleEdit = async (editPrompt: string) => {
    if (!openaiApiKey) return;
    try {
      const openaiClient = new OpenAIClient(openaiApiKey);
      const editedText = await openaiClient.editStory(
        story.content,
        selectedText,
        selectionRange.start,
        selectionRange.end,
        editPrompt,
        contextualPrompt,
      );

      const newContent =
        story.content.substring(0, selectionRange.start) + editedText + story.content.substring(selectionRange.end);

      await onStoryUpdate(newContent, {
        type: 'gpt-edit',
        prompt: editPrompt,
        editedRange: selectionRange,
        contextualPrompt,
      });

      setShowPrompt(false);
    } catch (error) {
      console.error('Edit failed:', error);
    }
  };

  const handleContextualPromptUpdate = async (newContextualPrompt: string) => {
    setContextualPrompt(newContextualPrompt);
    await onStoryUpdate(story.content, { type: 'contextual-prompt-update', contextualPrompt: newContextualPrompt });
  };

  return (
    <div className="space-y-4">
      <ContextualPrompt
        value={contextualPrompt}
        onChange={handleContextualPromptUpdate}
        placeholder="Add guidelines (e.g., 'Keep the tone mysterious and dark', 'Write in first person')"
      />

      <div className="relative">
        <div
          ref={editorRef}
          id="story-editor"
          contentEditable
          className="min-h-64 p-4 border rounded-lg focus:outline-none bg-white text-gray-900 whitespace-pre-wrap"
          onMouseUp={handleTextSelection}
          suppressContentEditableWarning
        >
          {story.content}
        </div>

        {showPrompt && (
          <PromptBox
            selectedText={selectedText}
            contextualPrompt={contextualPrompt}
            onSubmit={handleEdit}
            onCancel={() => setShowPrompt(false)}
          />
        )}
      </div>
    </div>
  );
}

function getTextOffset(root: Node, node: Node, offset: number): number {
  let textOffset = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let currentNode: Node | null;
  // eslint-disable-next-line no-cond-assign
  while ((currentNode = walker.nextNode())) {
    if (currentNode === node) {
      return textOffset + offset;
    }
    textOffset += currentNode.textContent?.length || 0;
  }
  return textOffset;
}


