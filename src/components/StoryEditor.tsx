'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import PromptBox from '@/components/PromptBox';
import GenerateStoryDialog from '@/components/GenerateStoryDialog';
import { OpenAIClient } from '@/lib/openai';
import { debounce } from '@/lib/utils';

interface StoryEditorProps {
  story: { id: string; content: string; contextualPrompt?: string };
  onStoryUpdate: (
    newContent: string,
    meta: { type: string; prompt?: string; editedRange?: { start: number; end: number }; contextualPrompt?: string; createVersion?: boolean },
  ) => Promise<void> | void;
  openaiApiKey?: string;
  contextualPrompt?: string;
  onContextualPromptChange?: (context: string) => void;
}

export default function StoryEditor({ story, onStoryUpdate, openaiApiKey, contextualPrompt, onContextualPromptChange }: StoryEditorProps) {
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptPosition, setPromptPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [candidateText, setCandidateText] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string>('');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  const [slashPromptPosition, setSlashPromptPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [showSlashPrompt, setShowSlashPrompt] = useState(false);
  const [slashInsertPosition, setSlashInsertPosition] = useState<number>(0);
  const isActiveRef = useRef(true);
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const lastContentRef = useRef(story.content);
  const lastStoryContentRef = useRef(story.content);

  const [showPlaceholder, setShowPlaceholder] = useState(true);

  // Debounced version creation - creates version after user stops typing for 2 seconds
  const debouncedCreateVersion = useCallback(
    debounce((content: string) => {
      if (content !== lastContentRef.current) {
        onStoryUpdate(content, { type: 'user-input', createVersion: true });
        lastContentRef.current = content;
        lastStoryContentRef.current = content;
      }
    }, 2000),
    [onStoryUpdate]
  );

  const handleInput = useCallback(() => {
    // Update the story content when user types
    if (editorRef.current) {
      const newContent = editorRef.current.textContent || '';
      
      // Hide placeholder when user starts typing
      if (newContent.trim() && showPlaceholder) {
        setShowPlaceholder(false);
      }
      
      if (newContent !== story.content) {
        // Update our tracking refs
        lastContentRef.current = newContent;
        lastStoryContentRef.current = newContent;
        // Immediate update without version
        onStoryUpdate(newContent, { type: 'user-input' });
        // Debounced version creation
        debouncedCreateVersion(newContent);
      }
    }
  }, [story.content, onStoryUpdate, debouncedCreateVersion, showPlaceholder]);

  // Initialize editor content and update when story content changes externally
  useEffect(() => {
    if (editorRef.current) {
      // Only update if this is a genuine external change (not from our own input)
      if (story.content !== lastStoryContentRef.current) {
        const currentEditorContent = editorRef.current.textContent || '';
        if (currentEditorContent !== story.content) {
          // Store current cursor position
          const selection = window.getSelection();
          const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
          const cursorOffset = range ? getTextOffset(editorRef.current, range.startContainer, range.startOffset) : 0;
          
          // Update content
          editorRef.current.textContent = story.content;
          
          // Update placeholder visibility
          setShowPlaceholder(!story.content.trim());
          
          // Restore cursor position if possible
          if (cursorOffset <= story.content.length) {
            const newRange = document.createRange();
            const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT);
            let currentNode: Node | null;
            let currentOffset = 0;
            
            while ((currentNode = walker.nextNode())) {
              const nodeLength = currentNode.textContent?.length || 0;
              if (currentOffset + nodeLength >= cursorOffset) {
                const nodeOffset = cursorOffset - currentOffset;
                newRange.setStart(currentNode, Math.min(nodeOffset, nodeLength));
                newRange.collapse(true);
                selection?.removeAllRanges();
                selection?.addRange(newRange);
                break;
              }
              currentOffset += nodeLength;
            }
          }
          
          // Update our tracking refs
          lastContentRef.current = story.content;
          lastStoryContentRef.current = story.content;
        }
      }
      isInitializedRef.current = true;
    }
  }, [story.content]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === '/') {
      const selection = window.getSelection();
      if (selection && editorRef.current) {
        // Let the '/' character appear first
        setTimeout(() => {
          const range = selection.getRangeAt(0);
          const insertPosition = getTextOffset(editorRef.current!, range.startContainer, range.startOffset);
          setSlashInsertPosition(insertPosition - 1); // Account for the '/' we just inserted
          
          // Position the prompt popover near the cursor
          let rect = range.getBoundingClientRect();
          
          // If we don't have a proper rect (empty content), use the editor's position
          if (rect.width === 0 && rect.height === 0) {
            const editorRect = editorRef.current!.getBoundingClientRect();
            rect = {
              ...rect,
              top: editorRect.top + 20, // Add some padding from top
              left: editorRect.left + 16, // Add some padding from left
              bottom: editorRect.top + 40
            };
          }
          
          const scrollY = window.scrollY || document.documentElement.scrollTop;
          const scrollX = window.scrollX || document.documentElement.scrollLeft;
          setSlashPromptPosition({ 
            top: rect.bottom + scrollY + 8, 
            left: Math.min(rect.left + scrollX, window.innerWidth - 320) 
          });
          
          // Remove the '/' character we just inserted
          const currentContent = editorRef.current!.textContent || '';
          const newContent = currentContent.slice(0, insertPosition) + currentContent.slice(insertPosition + 1);
          editorRef.current!.textContent = newContent;
          
          // Restore cursor position
          const newRange = document.createRange();
          const walker = document.createTreeWalker(editorRef.current!, NodeFilter.SHOW_TEXT);
          let currentNode: Node | null;
          let currentOffset = 0;
          
          // Find the correct position to place cursor
          while ((currentNode = walker.nextNode())) {
            const nodeLength = currentNode.textContent?.length || 0;
            if (currentOffset + nodeLength >= insertPosition) {
              const nodeOffset = insertPosition - currentOffset;
              newRange.setStart(currentNode, Math.min(nodeOffset, nodeLength));
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
              break;
            }
            currentOffset += nodeLength;
          }
          
          setShowSlashPrompt(true);
        }, 0);
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

  // Helper function to remove the '/' character from the editor
  const removeSlashCharacter = useCallback(() => {
    if (editorRef.current && slashInsertPosition >= 0) {
      const currentContent = editorRef.current.textContent || '';
      // Check if there's a '/' at the slash position
      if (currentContent[slashInsertPosition] === '/') {
        const newContent = 
          currentContent.substring(0, slashInsertPosition) + 
          currentContent.substring(slashInsertPosition + 1);
        
        editorRef.current.textContent = newContent;
        
        // Update the story content
        onStoryUpdate(newContent, { type: 'user-input' });
        
        // Restore cursor position
        const range = document.createRange();
        const selection = window.getSelection();
        const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT);
        let currentNode: Node | null;
        let currentOffset = 0;
        
        while ((currentNode = walker.nextNode())) {
          const nodeLength = currentNode.textContent?.length || 0;
          if (currentOffset + nodeLength >= slashInsertPosition) {
            const nodeOffset = slashInsertPosition - currentOffset;
            range.setStart(currentNode, Math.min(nodeOffset, nodeLength));
            range.collapse(true);
            selection?.removeAllRanges();
            selection?.addRange(range);
            break;
          }
          currentOffset += nodeLength;
        }
      }
    }
  }, [slashInsertPosition, onStoryUpdate]);

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
        createVersion: true,
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
      createVersion: true,
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

  // Handle clicks on the empty area to focus the editor
  const handleEmptyAreaClick = useCallback(() => {
    if (editorRef.current && showPlaceholder) {
      editorRef.current.focus();
      
      // Ensure there's a text node to position cursor in
      if (editorRef.current.childNodes.length === 0) {
        editorRef.current.appendChild(document.createTextNode(''));
      }
      
      // Position cursor at the very beginning
      const range = document.createRange();
      const selection = window.getSelection();
      
      // Find the first text node or create one
      const firstNode = editorRef.current.firstChild || editorRef.current.appendChild(document.createTextNode(''));
      
      range.setStart(firstNode, 0);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [showPlaceholder]);



  const handleStoryGenerated = async (generatedStory: string, storyContext: string) => {
    await onStoryUpdate(generatedStory, {
      type: 'ai-generated',
      prompt: 'Generate a basic story with AI',
      contextualPrompt: storyContext, // Save the story context
      createVersion: true,
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
    
    setShowPlaceholder(false);
  };

  // When popover closes, cancel/ignore any in-flight result
  useEffect(() => {
    if (!showPrompt && !showSlashPrompt) {
      isActiveRef.current = false;
      setIsGenerating(false);
      setCandidateText(null);
    }
  }, [showPrompt, showSlashPrompt]);

  // Remove slash character when slash prompt closes
  useEffect(() => {
    if (!showSlashPrompt) {
      removeSlashCharacter();
    }
  }, [showSlashPrompt, removeSlashCharacter]);

  // Update placeholder visibility when content changes
  useEffect(() => {
    const checkEmpty = () => {
      const isContentEmpty = !story.content.trim();
      const isDomEmpty = !editorRef.current?.textContent?.trim();
      setShowPlaceholder(isContentEmpty && isDomEmpty);
    };
    
    checkEmpty();
    // Also check when story content changes
    const timer = setTimeout(checkEmpty, 100);
    return () => clearTimeout(timer);
  }, [story.content]);

  // Focus editor and position cursor at beginning when it's empty
  useEffect(() => {
    if (showPlaceholder && editorRef.current) {
      editorRef.current.focus();
      
      // Ensure there's a text node to position cursor in
      if (editorRef.current.childNodes.length === 0) {
        editorRef.current.appendChild(document.createTextNode(''));
      }
      
      // Position cursor at the very beginning
      const range = document.createRange();
      const selection = window.getSelection();
      
      // Find the first text node or create one
      const firstNode = editorRef.current.firstChild || editorRef.current.appendChild(document.createTextNode(''));
      
      range.setStart(firstNode, 0);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [showPlaceholder]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="relative flex justify-center min-h-[60vh]">
          <div
            ref={editorRef}
            id="story-editor"
            contentEditable
            className="min-h-full p-4 bg-white text-gray-900 whitespace-pre-wrap focus:outline-none w-full"
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

          {showPlaceholder && (
            <>
              {/* Clickable overlay for the entire empty area */}
              <div 
                className="absolute inset-0 cursor-text"
                onClick={handleEmptyAreaClick}
              />
              
              {/* Placeholder text - positioned to match editor text exactly */}
              <div 
                className="absolute pointer-events-none text-gray-400 font-normal tracking-wide"
                style={{ 
                  top: '16px',  // p-4 = 16px
                  left: '50%',
                  transform: 'translateX(-50%)',
                  maxWidth: '80ch',
                  width: 'calc(100% - 32px)', // Account for p-4 on both sides
                  lineHeight: '1.6',
                  fontFamily: 'sans-serif',
                  paddingLeft: '16px',
                  paddingRight: '16px'
                }}
              >
                Start your story here… or{' '}
                <button
                  onClick={handleGenerateWithAI}
                  className="underline hover:text-gray-600 transition-colors pointer-events-auto font-normal"
                >
                  Generate a story
                </button>
                {' '}to let AI spark the first draft.
              </div>
            </>
          )}
        </div>

        {showPrompt && (
          <PromptBox
            position={promptPosition}
            isGenerating={isGenerating}
            candidateText={candidateText}
            onGenerate={runGeneration}
            onApply={applyCandidate}
            onRetry={retryGeneration}
            onCancel={() => setShowPrompt(false)}
            apiKey={openaiApiKey}
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
            onCancel={() => {
              removeSlashCharacter();
              setShowSlashPrompt(false);
            }}
            isSlashMode={true}
            apiKey={openaiApiKey}
          />
        )}
      </div>

      <GenerateStoryDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        onStoryGenerated={handleStoryGenerated}
        apiKey={openaiApiKey}
        contextualPrompt={contextualPrompt}
        onContextualPromptChange={onContextualPromptChange}
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


