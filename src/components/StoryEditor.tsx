'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import PromptBox from '@/components/PromptBox';
import GenerateStoryDialog from '@/components/GenerateStoryDialog';
import { Button } from '@/components/ui/button';
import { OpenAIClient } from '@/lib/openai';

interface StoryEditorProps {
  story: { id: string; content: string; contextualPrompt?: string };
  onStoryUpdate: (
    newContent: string,
    meta: { type: string; prompt?: string; editedRange?: { start: number; end: number }; contextualPrompt?: string },
  ) => Promise<void> | void;
  openaiApiKey?: string;
  contextualPrompt?: string;
}

export default function StoryEditor({ story, onStoryUpdate, openaiApiKey, contextualPrompt }: StoryEditorProps) {
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptPosition, setPromptPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [candidateText, setCandidateText] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string>('');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showEmptyOptions, setShowEmptyOptions] = useState(false);
  const [slashPromptPosition, setSlashPromptPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [showSlashPrompt, setShowSlashPrompt] = useState(false);
  const [slashInsertPosition, setSlashInsertPosition] = useState<number>(0);
  const isActiveRef = useRef(true);
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  // Check if content is empty - also check the actual DOM content
  const isEmpty = !story.content.trim() && (!editorRef.current || !editorRef.current.textContent?.trim());

  const handleInput = useCallback(() => {
    // Update the story content when user types
    if (editorRef.current) {
      const newContent = editorRef.current.textContent || '';
      if (newContent !== story.content) {
        onStoryUpdate(newContent, { type: 'user-input' });
      }
    }
  }, [story.content, onStoryUpdate]);

  // Initialize editor content only once
  useEffect(() => {
    if (editorRef.current && !isInitializedRef.current) {
      editorRef.current.textContent = story.content;
      isInitializedRef.current = true;
    }
  }, [story.content]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === '/') {
      e.preventDefault();
      const selection = window.getSelection();
      if (selection && editorRef.current) {
        const range = selection.getRangeAt(0);
        const insertPosition = getTextOffset(editorRef.current, range.startContainer, range.startOffset);
        setSlashInsertPosition(insertPosition);
        
        // Position the prompt popover near the cursor
        const rect = range.getBoundingClientRect();
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const scrollX = window.scrollX || document.documentElement.scrollLeft;
        setSlashPromptPosition({ 
          top: rect.bottom + scrollY + 8, 
          left: Math.min(rect.left + scrollX, window.innerWidth - 320) 
        });
        setShowSlashPrompt(true);
      }
    }
  }, []);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() && editorRef.current) {
      const text = selection.toString();
      const range = selection.getRangeAt(0);
      const start = getTextOffset(editorRef.current, range.startContainer, range.startOffset);
      const end = start + text.length;
      setSelectedText(text);
      setSelectionRange({ start, end });
      // Position the popover near the selection
      const rect = range.getBoundingClientRect();
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      // Offset a bit below the selection
      setPromptPosition({ top: rect.bottom + scrollY + 8, left: Math.min(rect.left + scrollX, window.innerWidth - 320) });
      setShowPrompt(true);
    }
  }, []);

  // Maintain text selection when popover is active
  useEffect(() => {
    if (showPrompt && editorRef.current) {
      // Prevent the editor from losing focus when popover is active
      const handleBlur = (e: FocusEvent) => {
        if (showPrompt && !(e.relatedTarget as Element)?.closest('[data-popover]')) {
          e.preventDefault();
          editorRef.current?.focus();
        }
      };
      
      editorRef.current.addEventListener('blur', handleBlur);
      return () => editorRef.current?.removeEventListener('blur', handleBlur);
    }
  }, [showPrompt]);

  const runGeneration = async (editPrompt: string) => {
    if (!openaiApiKey) return;
    setIsGenerating(true);
    setLastPrompt(editPrompt);
    isActiveRef.current = true;
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
      if (!isActiveRef.current) return; // closed or canceled
      setCandidateText(editedText);
    } catch (error) {
      console.error('Edit failed:', error);
    } finally {
      if (isActiveRef.current) setIsGenerating(false);
    }
  };

  const runSlashGeneration = async (prompt: string) => {
    if (!openaiApiKey) return;
    setIsGenerating(true);
    setLastPrompt(prompt);
    isActiveRef.current = true;
    try {
      const openaiClient = new OpenAIClient(openaiApiKey);
      const generatedText = await openaiClient.generateContentWithContext(
        prompt,
        story.content,
        contextualPrompt
      );
      if (!isActiveRef.current) return;
      
      // Insert the generated text at the slash position
      const newContent = 
        story.content.substring(0, slashInsertPosition) + 
        generatedText + 
        story.content.substring(slashInsertPosition);
      
      await onStoryUpdate(newContent, {
        type: 'slash-insert',
        prompt,
        contextualPrompt,
      });
      
      // Update the editor content directly
      if (editorRef.current) {
        editorRef.current.textContent = newContent;
        
        // Move cursor to end
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      
      setShowSlashPrompt(false);
    } catch (error) {
      console.error('Slash generation failed:', error);
    } finally {
      if (isActiveRef.current) setIsGenerating(false);
    }
  };

  const applyCandidate = async () => {
    if (candidateText == null) return;
    const newContent =
      story.content.substring(0, selectionRange.start) + candidateText + story.content.substring(selectionRange.end);
    await onStoryUpdate(newContent, {
      type: 'gpt-edit',
      prompt: lastPrompt,
      editedRange: selectionRange,
      contextualPrompt,
    });
    
    // Update the editor content directly
    if (editorRef.current) {
      editorRef.current.textContent = newContent;
      
      // Restore the selection range for the replaced text
      const range = document.createRange();
      const selection = window.getSelection();
      
      // Find the text node and position for the start of the replacement
      const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT);
      let currentNode: Node | null;
      let currentOffset = 0;
      
      while ((currentNode = walker.nextNode())) {
        const nodeLength = currentNode.textContent?.length || 0;
        if (currentOffset + nodeLength >= selectionRange.start) {
          const startOffset = selectionRange.start - currentOffset;
          const endOffset = Math.min(startOffset + candidateText.length, nodeLength);
          
          range.setStart(currentNode, startOffset);
          range.setEnd(currentNode, endOffset);
          break;
        }
        currentOffset += nodeLength;
      }
      
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    
    setShowPrompt(false);
    setCandidateText(null);
    setIsGenerating(false);
  };

  const retryGeneration = async () => {
    if (!lastPrompt) return;
    setCandidateText(null);
    await runGeneration(lastPrompt);
  };

  const handleGenerateWithAI = () => {
    setShowGenerateDialog(true);
  };

  const handleWriteOnMyOwn = () => {
    setShowEmptyOptions(false);
    // Focus the editor
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleStoryGenerated = async (generatedStory: string, storyContext: string) => {
    await onStoryUpdate(generatedStory, {
      type: 'ai-generated',
      prompt: 'Generate a basic story with AI',
      contextualPrompt: storyContext, // Save the story context
    });
    
    // Update the editor content directly
    if (editorRef.current) {
      editorRef.current.textContent = generatedStory;
      
      // Move cursor to end
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    
    setShowEmptyOptions(false);
  };

  // When popover closes, cancel/ignore any in-flight result
  useEffect(() => {
    if (!showPrompt && !showSlashPrompt) {
      isActiveRef.current = false;
      setIsGenerating(false);
      setCandidateText(null);
    }
  }, [showPrompt, showSlashPrompt]);

  // Show empty options when content is empty
  useEffect(() => {
    const checkEmpty = () => {
      const isContentEmpty = !story.content.trim();
      const isDomEmpty = !editorRef.current?.textContent?.trim();
      setShowEmptyOptions(isContentEmpty && isDomEmpty);
    };
    
    checkEmpty();
    // Also check when story content changes
    const timer = setTimeout(checkEmpty, 100);
    return () => clearTimeout(timer);
  }, [story.content]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <div
          ref={editorRef}
          id="story-editor"
          contentEditable
          className="min-h-[calc(100vh-220px)] p-4 bg-white text-gray-900 whitespace-pre-wrap focus:outline-none"
          style={{ 
            maxWidth: '80ch',
            lineHeight: '1.6',
            fontFamily: 'sans-serif'
          }}
          onMouseUp={handleTextSelection}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          suppressContentEditableWarning
        />

        {showEmptyOptions && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-95 z-10">
            <div className="space-y-4 text-center">
              <div className="text-lg font-medium text-gray-700">Start your story</div>
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={handleGenerateWithAI}
                  className="px-6 py-2"
                >
                  Generate a basic story with AI
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleWriteOnMyOwn}
                  className="px-6 py-2"
                >
                  Write on my own
                </Button>
              </div>
            </div>
          </div>
        )}

        {showPrompt && (
          <PromptBox
            position={promptPosition}
            isGenerating={isGenerating}
            candidateText={candidateText}
            onGenerate={runGeneration}
            onApply={applyCandidate}
            onRetry={retryGeneration}
            onCancel={() => setShowPrompt(false)}
          />
        )}

        {showSlashPrompt && (
          <PromptBox
            position={slashPromptPosition}
            isGenerating={isGenerating}
            candidateText={null}
            onGenerate={runSlashGeneration}
            onApply={() => setShowSlashPrompt(false)}
            onRetry={() => runSlashGeneration(lastPrompt)}
            onCancel={() => setShowSlashPrompt(false)}
            isSlashMode={true}
          />
        )}
      </div>

      <GenerateStoryDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        onStoryGenerated={handleStoryGenerated}
        apiKey={openaiApiKey}
      />
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


