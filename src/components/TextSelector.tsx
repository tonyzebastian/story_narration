'use client';

import { useEffect } from 'react';

interface TextSelectorProps {
  onSelect: (text: string, range: { start: number; end: number }) => void;
}

export default function TextSelector({ onSelect }: TextSelectorProps) {
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || !selection.toString().trim()) return;
      const text = selection.toString();
      const range = selection.getRangeAt(0);
      const editor = document.getElementById('story-editor');
      if (!editor) return;
      const { start } = getTextOffsetAndNode(editor, range.startContainer, range.startOffset);
      onSelect(text, { start, end: start + text.length });
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [onSelect]);

  return null;
}

function getTextOffsetAndNode(root: Node, node: Node, offset: number): { start: number } {
  let textOffset = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let currentNode: Node | null;
  // eslint-disable-next-line no-cond-assign
  while ((currentNode = walker.nextNode())) {
    if (currentNode === node) return { start: textOffset + offset };
    textOffset += currentNode.textContent?.length || 0;
  }
  return { start: textOffset };
}


