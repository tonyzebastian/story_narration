# Story Creation & Narration App – Technical Documentation

## Overview
Next.js app to draft/edit stories with OpenAI and generate narrations with ElevenLabs. It supports selection-based editing with contextual guidelines, version history, and audio playback with voice selection.

## Implemented
- Layout similar to the reference sample:
  - Header with app title and API key popover (OpenAI, ElevenLabs)
  - Main grid: left editor, right sidebar with Tabs
  - Tabs: “Story Context” (ContextualPrompt) and “Version History”
  - Persistent Bottom Bar: voice selector + audio controls
- Story editing canvas (contentEditable) with selection-triggered sticky popover for edit prompts
  - Popover is compact, vertical, instruction-only (no selected text/guidelines shown inside)
- Contextual, story-wide guidelines applied to GPT edits
- Version history (new record on each edit, revert supported)
- ElevenLabs integration: list voices, TTS to Blob, playback
- IndexedDB (Dexie) for stories, versions, audio, settings (API keys, preferences)
- shadcn/ui components integrated (button, input, label, tabs, card, textarea)
- Hydration-safe date formatting; page set to dynamic and initializes on client

## Tech Stack
- Next.js 14 (App Router) + React 18
- Tailwind CSS + shadcn/ui
- Dexie (IndexedDB)
- OpenAI Chat Completions
- ElevenLabs Text-to-Speech
- HTMLAudioElement + Blob URLs

## Dependencies and versions (from package.json)
```json
{
  "dependencies": {
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-tabs": "^1.1.12",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "dexie": "^3.2.4",
    "lucide-react": "^0.263.0",
    "next": "^14.2.5",
    "openai": "^4.56.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^2.5.2"
  },
  "devDependencies": {
    "@types/node": "24.2.0",
    "@types/react": "19.1.9",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.7",
    "typescript": "5.9.2"
  }
}
```

## Architecture
- App Router
  - `src/app/layout.tsx`: global styles
  - `src/app/page.tsx`: client page, `export const dynamic = 'force-dynamic'`
    - Loads `settings` and initial `story` from IndexedDB on mount
    - Manages audio generation and settings
    - Grid `[editor] | [sidebar]` with responsive fixed sidebar width (≈380–420px)

- Components
  - `Header`: app title + API key popover (OpenAI/ElevenLabs), saves to Dexie `settings`
  - `StoryEditor`: contentEditable; selection-based editing
    - Computes selection offsets via `TreeWalker`
    - Calls OpenAI to produce replacement text; replaces only selected range
    - Positions `PromptBox` just below selection using selection range bounding rect
  - `PromptBox`: fixed, compact vertical card for instruction (no selected text/guidelines)
  - `VersionHistory`: list + revert; hydration-safe timestamps
  - `ContextualPrompt`: story-wide guidelines editor (sidebar)
  - `BottomBar`: `VoiceSelector` + `AudioPlayer`
  - `components/ui/*`: shadcn/ui primitives

### Source Layout
```
src/
├─ app/
│  ├─ page.tsx
│  ├─ layout.tsx
│  └─ globals.css
├─ components/
│  ├─ ui/
│  ├─ Header.tsx
│  ├─ BottomBar.tsx
│  ├─ StoryEditor.tsx
│  ├─ PromptBox.tsx
│  ├─ ContextualPrompt.tsx
│  ├─ VersionHistory.tsx
│  ├─ VoiceSelector.tsx
│  └─ AudioPlayer.tsx
├─ lib/
│  ├─ database.ts
│  ├─ openai.ts
│  ├─ elevenlabs.ts
│  ├─ audio.ts
│  ├─ utils.ts
│  └─ cn.ts
└─ types/
   └─ index.ts
```

## Data Model (Dexie / IndexedDB)
- DB: `StoryDatabase` (name: `StoryNarrationApp`)
- Tables
  - `stories`: `id`, `title`, `content`, `contextualPrompt`, `createdAt`, `updatedAt`, `versions`, `currentVersionId`
  - `versions`: `id`, `storyId`, `content`, `timestamp`, `editType`, `editPrompt?`, `editedRange?`
  - `audioFiles`: `id`, `storyId`, `versionId`, `voiceId`, `audioBlob`, `duration`, `createdAt`
  - `settings`: `id='settings'`, `openaiApiKey?`, `elevenlabsApiKey?`, `selectedVoice?`, `preferences`
- Hook: `stories.updating` stamps `updatedAt = new Date()`

### Types (excerpt)
```ts
export interface StoryVersion {
  id: string;
  storyId: string;
  content: string;
  timestamp: Date;
  editType: 'user' | 'gpt' | 'initial';
  editPrompt?: string;
  editedRange?: { start: number; end: number };
}

export interface Story {
  id: string;
  title: string;
  content: string;
  contextualPrompt: string;
  createdAt: Date;
  updatedAt: Date;
  versions: StoryVersion[];
  currentVersionId: string;
}

export interface AppSettings {
  id: 'settings';
  openaiApiKey?: string;
  elevenlabsApiKey?: string;
  selectedVoice?: string;
  preferences: { autoSave: boolean; maxVersionHistory: number };
}
```

## Editing Flow
1. Select text in the editor.
2. Compute character offsets with `TreeWalker` from editor root; capture `{ start, end }`.
3. Use selection `Range` bounding rect to place `PromptBox` below the selection.
4. Submit instruction; call OpenAI with full story, selected text, offsets, contextualPrompt.
5. Replace only the selected range; persist a new version.

## OpenAI (`lib/openai.ts`)
- Browser client with key from `settings`.
- `generateStory(prompt)` and `editStory(fullStory, selectedText, start, end, editPrompt, contextualPrompt?)`.

## ElevenLabs (`lib/elevenlabs.ts`)
- `getVoices()` and `textToSpeech(text, voiceId, options?)` – returns Blob.

## APIs & Endpoints
- OpenAI (Chat Completions)
  - Base: `https://api.openai.com/v1`
  - POST `chat/completions` (used by `generateStory`, `editStory`)
- ElevenLabs
  - Base: `https://api.elevenlabs.io/v1`
  - GET `voices` (list voices)
  - POST `text-to-speech/{voice_id}` (generate audio)

## Hydration & SSR
- Dates via `Intl.DateTimeFormat('en-GB', { hour12: false, timeZone: 'UTC' })`.
- `suppressHydrationWarning` on version timestamps.
- Page is dynamic; data initialized on client to avoid SSR serialization mismatches.

## Styling & Layout
- Tailwind utilities; grid with fixed-width sidebar (≈380–420px on lg+).
- Full-width header and bottom bar; sidebar left border on large screens.

## Environment
- `.env.local`
  - `NEXT_PUBLIC_APP_NAME="Story Narration App"`
- API keys are entered via UI and saved in Dexie `settings`.

## Development
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`

## Remaining Work
- Editor UX polish (keyboard/motion, mobile selection behavior)
- Error/empty states for API and data operations
- Optional audio Blob persistence/cleanup policies
- Visual refinements & additional shadcn/ui components
