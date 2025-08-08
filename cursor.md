# Story Creation & Narration App - Technical Documentation

## Overview
A Next.js-based playground application that combines OpenAI GPT for story creation and ElevenLabs for audio narration. Users can create, edit, and iterate on stories collaboratively with AI, then generate high-quality audio narrations.

## Tech Stack
- **Frontend**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Storage**: Browser IndexedDB (using Dexie.js)
- **APIs**: OpenAI GPT-4, ElevenLabs Text-to-Speech
- **Audio**: Web Audio API for playback

## Core Features

### 1. Story Creation & Editing
- Collaborative text editing between user and GPT
- Text selection-based editing with contextual prompts
- Real-time story updates and regeneration

### 2. Version Control
- Complete version history tracking
- Ability to revert to any previous version
- Branch-like editing from any point in history

### 3. Audio Narration
- Text-to-speech using ElevenLabs API
- Voice selection and customization
- Audio playback controls

## Architecture

### Component Structure
```
src/
├── app/
│   ├── page.tsx                 # Main playground page
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── components/
│   ├── ui/                     # shadcn components
│   ├── StoryEditor.tsx         # Main story editing interface
│   ├── TextSelector.tsx        # Text selection handler
│   ├── PromptBox.tsx          # Floating prompt input
│   ├── ContextualPrompt.tsx    # Global context prompt editor
│   ├── VersionHistory.tsx      # Version control UI
│   ├── AudioPlayer.tsx         # Audio playback controls
│   ├── VoiceSelector.tsx       # Voice selection component
│   └── ApiKeyManager.tsx       # API key input/management
├── lib/
│   ├── database.ts             # IndexedDB setup with Dexie
│   ├── openai.ts              # OpenAI API client
│   ├── elevenlabs.ts          # ElevenLabs API client
│   ├── audio.ts               # Audio processing utilities
│   └── utils.ts               # General utilities
└── types/
    └── index.ts               # TypeScript definitions
```

## Database Schema (IndexedDB)

### Stories Table
```typescript
interface Story {
  id: string;
  title: string;
  content: string;
  contextualPrompt: string; // Global context for all GPT requests
  createdAt: Date;
  updatedAt: Date;
  versions: StoryVersion[];
  currentVersionId: string;
}
```

### StoryVersions Table
```typescript
interface StoryVersion {
  id: string;
  storyId: string;
  content: string;
  parentVersionId?: string;
  timestamp: Date;
  editType: 'user' | 'gpt' | 'initial';
  editPrompt?: string;
  editedRange?: {
    start: number;
    end: number;
  };
}
```

### AudioFiles Table
```typescript
interface AudioFile {
  id: string;
  storyId: string;
  versionId: string;
  voiceId: string;
  audioBlob: Blob;
  duration: number;
  createdAt: Date;
}
```

### Settings Table
```typescript
interface AppSettings {
  id: 'settings';
  openaiApiKey?: string;
  elevenlabsApiKey?: string;
  selectedVoice?: string;
  preferences: {
    autoSave: boolean;
    maxVersionHistory: number;
  };
}
```

## API Integration

### OpenAI Integration

#### Configuration
```typescript
// lib/openai.ts
import OpenAI from 'openai';

export class OpenAIClient {
  private client: OpenAI;
  
  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  async generateStory(prompt: string): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a creative storyteller. Generate engaging, well-structured stories based on user prompts."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });
    
    return completion.choices[0]?.message?.content || '';
  }

  async editStory(
    fullStoryText: string,
    selectedText: string,
    selectionStart: number,
    selectionEnd: number,
    editPrompt: string,
    contextualPrompt?: string
  ): Promise<string> {
    const systemPrompt = `You are an expert story editor. You will receive:
1. The full story for context
2. A specific text selection to modify
3. Instructions for the modification
4. Optional contextual guidelines

Your task is to return ONLY the replacement text for the selected portion. The replacement should:
- Maintain narrative coherence with the full story
- Follow the editing instructions precisely  
- Respect the contextual guidelines if provided
- Keep appropriate length and style consistency`;

    const userPrompt = `Full story context:
"${fullStoryText}"

Selected text to replace (characters ${selectionStart}-${selectionEnd}):
"${selectedText}"

Edit instruction: ${editPrompt}

${contextualPrompt ? `\nContextual guidelines: ${contextualPrompt}` : ''}

Return only the replacement text for the selected portion.`;

    const completion = await this.client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.5
    });
    
    return completion.choices[0]?.message?.content || '';
  }
}
```

### ElevenLabs Integration

#### API Endpoints
- **Text-to-Speech**: `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`
- **Get Voices**: `GET https://api.elevenlabs.io/v1/voices`

#### Implementation
```typescript
// lib/elevenlabs.ts
export class ElevenLabsClient {
  private apiKey: string;
  private baseURL = 'https://api.elevenlabs.io/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getVoices(): Promise<Voice[]> {
    const response = await fetch(`${this.baseURL}/voices`, {
      headers: {
        'xi-api-key': this.apiKey
      }
    });
    
    const data = await response.json();
    return data.voices;
  }

  async textToSpeech(
    text: string,
    voiceId: string,
    options: TTSOptions = {}
  ): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: options.modelId || 'eleven_monolingual_v1',
        voice_settings: {
          stability: options.stability || 0.5,
          similarity_boost: options.similarityBoost || 0.5
        },
        output_format: options.outputFormat || 'mp3_22050_32'
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    return await response.blob();
  }
}

interface TTSOptions {
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  outputFormat?: string;
}

interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
}
```

## Key Components Implementation

### Story Editor Component
```typescript
// components/StoryEditor.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import TextSelector from './TextSelector';
import PromptBox from './PromptBox';
import ContextualPrompt from './ContextualPrompt';

export default function StoryEditor({ story, onStoryUpdate }) {
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });
  const [showPrompt, setShowPrompt] = useState(false);
  const [contextualPrompt, setContextualPrompt] = useState(story.contextualPrompt || '');
  const editorRef = useRef<HTMLDivElement>(null);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const text = selection.toString();
      const range = selection.getRangeAt(0);
      
      // Calculate character positions
      const start = getTextOffset(editorRef.current, range.startContainer, range.startOffset);
      const end = start + text.length;
      
      setSelectedText(text);
      setSelectionRange({ start, end });
      setShowPrompt(true);
    }
  }, []);

  const handleEdit = async (editPrompt: string) => {
    try {
      // Send full story context + selected text + contextual prompt to OpenAI
      const editedText = await openaiClient.editStory(
        story.content,
        selectedText,
        selectionRange.start,
        selectionRange.end,
        editPrompt,
        contextualPrompt
      );

      // Replace only the selected portion with the new text
      const newContent = 
        story.content.substring(0, selectionRange.start) +
        editedText +
        story.content.substring(selectionRange.end);

      // Save new version and update story
      await onStoryUpdate(newContent, {
        type: 'gpt-edit',
        prompt: editPrompt,
        editedRange: selectionRange,
        contextualPrompt
      });

      setShowPrompt(false);
    } catch (error) {
      console.error('Edit failed:', error);
      // Handle error appropriately
    }
  };

  const handleContextualPromptUpdate = async (newContextualPrompt: string) => {
    setContextualPrompt(newContextualPrompt);
    await onStoryUpdate(story.content, {
      type: 'contextual-prompt-update',
      contextualPrompt: newContextualPrompt
    });
  };

  return (
    <div className="space-y-4">
      {/* Contextual Prompt Section */}
      <ContextualPrompt
        value={contextualPrompt}
        onChange={handleContextualPromptUpdate}
        placeholder="Add contextual instructions that will guide all GPT edits (e.g., 'Keep the tone mysterious and dark', 'Write in first person', 'Target young adult audience')"
      />

      {/* Story Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          className="min-h-96 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onMouseUp={handleTextSelection}
          dangerouslySetInnerHTML={{ __html: story.content }}
        />
        
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

// Utility function to get text offset
function getTextOffset(root: Node, node: Node, offset: number): number {
  let textOffset = 0;
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let currentNode;
  while (currentNode = walker.nextNode()) {
    if (currentNode === node) {
      return textOffset + offset;
    }
    textOffset += currentNode.textContent?.length || 0;
  }
  
  return textOffset;
}
```

### Contextual Prompt Component
```typescript
// components/ContextualPrompt.tsx
'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface ContextualPromptProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function ContextualPrompt({ 
  value, 
  onChange, 
  placeholder 
}: ContextualPromptProps) {
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
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Info className="h-4 w-4" />
          Story Context & Guidelines
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isEditing ? (
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {value ? (
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                  {value}
                </p>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No contextual guidelines set. Click "Edit" to add instructions that will guide all GPT edits.
                </p>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              {value ? 'Edit' : 'Add'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              placeholder={placeholder}
              className="min-h-24"
              rows={3}
            />
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
        
        <div className="text-xs text-gray-500">
          <strong>Examples:</strong> "Keep the tone mysterious and dark", "Write in first person", 
          "Target young adult audience", "Maintain Victorian era language", etc.
        </div>
      </CardContent>
    </Card>
  );
}
```

### Enhanced Prompt Box Component
```typescript
// components/PromptBox.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

interface PromptBoxProps {
  selectedText: string;
  contextualPrompt?: string;
  onSubmit: (prompt: string) => void;
  onCancel: () => void;
}

export default function PromptBox({ 
  selectedText, 
  contextualPrompt, 
  onSubmit, 
  onCancel 
}: PromptBoxProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = () => {
    if (prompt.trim()) {
      onSubmit(prompt.trim());
    }
  };

  return (
    <Card className="absolute top-full left-0 right-0 mt-2 z-10 shadow-lg">
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Selected text:</div>
          <div className="text-sm bg-blue-50 p-2 rounded border-l-4 border-blue-200">
            "{selectedText}"
          </div>
        </div>

        {contextualPrompt && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Active guidelines:</div>
            <div className="text-xs bg-gray-50 p-2 rounded text-gray-600">
              {contextualPrompt}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-sm font-medium">How should this text be modified?</div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'Make this more dramatic', 'Add more dialogue', 'Simplify the language', etc."
            className="min-h-20"
            autoFocus
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={!prompt.trim()}>
            Apply Edit
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Audio Player Component
```typescript
// components/AudioPlayer.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square } from 'lucide-react';

export default function AudioPlayer({ audioBlob, onGenerateAudio, isGenerating }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioBlob && audioRef.current) {
      const url = URL.createObjectURL(audioBlob);
      audioRef.current.src = url;
      
      return () => URL.revokeObjectURL(url);
    }
  }, [audioBlob]);

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
      <Button
        onClick={onGenerateAudio}
        disabled={isGenerating}
        variant="outline"
      >
        {isGenerating ? 'Generating...' : 'Generate Audio'}
      </Button>

      {audioBlob && (
        <>
          <Button
            onClick={togglePlayback}
            variant="outline"
            size="sm"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <div className="text-sm text-gray-600">
            {Math.floor(currentTime)}s / {Math.floor(duration)}s
          </div>
        </>
      )}

      <audio
        ref={audioRef}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}
```

## Database Setup

### Dexie Configuration
```typescript
// lib/database.ts
import Dexie, { Table } from 'dexie';

export class StoryDatabase extends Dexie {
  stories!: Table<Story>;
  versions!: Table<StoryVersion>;
  audioFiles!: Table<AudioFile>;
  settings!: Table<AppSettings>;

  constructor() {
    super('StoryNarrationApp');
    
    this.version(1).stores({
      stories: '++id, title, createdAt, updatedAt',
      versions: '++id, storyId, timestamp, parentVersionId',
      audioFiles: '++id, storyId, versionId, voiceId, createdAt',
      settings: 'id'
    });

    // Add hooks for contextual prompt updates
    this.stories.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date();
    });
  }
}

export const db = new StoryDatabase();
```

## Security Considerations

### API Key Management
- API keys stored in browser localStorage (encrypted if possible)
- Keys masked in UI inputs
- Clear warnings about API key security
- Option to clear keys from storage

### Content Sanitization
- Sanitize HTML content before displaying
- Validate user inputs
- Rate limiting for API calls

## Performance Optimizations

### Text Processing
- Debounced auto-save functionality
- Efficient text selection algorithms
- Lazy loading of version history

### Audio Handling
- Audio caching in IndexedDB
- Streaming for large audio files
- Audio compression options

### Memory Management
- Cleanup of audio blob URLs
- Limited version history (configurable)
- Efficient database queries

## Error Handling

### API Errors
- Graceful handling of API rate limits
- Retry logic with exponential backoff
- User-friendly error messages
- Fallback options when APIs fail

### Storage Errors
- IndexedDB quota management
- Data corruption recovery
- Export/import functionality for data backup

## Development Setup

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_APP_NAME="Story Narration App"
```

### Package Dependencies
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "tailwindcss": "^3.0.0",
    "dexie": "^3.2.4",
    "openai": "^4.0.0",
    "@radix-ui/react-*": "^1.0.0",
    "lucide-react": "^0.263.0"
  }
}
```

### Installation & Setup
```bash
npm install
npm run dev
```

## Future Enhancements

### Phase 2 Features
- Multi-character voice mapping
- Story templates and genres
- Collaborative editing with real-time sync
- Advanced audio editing capabilities
- Export to various formats (PDF, EPUB, audiobook)

### Phase 3 Features
- Cloud storage integration
- AI-powered story analysis and suggestions
- Social sharing and community features
- Mobile app development