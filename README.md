# Story Creation & Narration App (OpenAI + ElevenLabs)

A Next.js app to draft/edit stories with OpenAI, then generate narrated audio using ElevenLabs. It supports selection-based edits with contextual guidelines, version history, and simple audio playback with voice selection.

## Features
- Selection-based GPT edits with a sticky instruction popover
- Story-wide contextual guidelines guiding all edits (auto-save on blur)
- Version history with revert (grouped by date, hover to revert)
- ElevenLabs TTS: list voices, generate audio, and play
- Full-width header and bottom bar; editor + sidebar layout
- IndexedDB (Dexie) for stories, versions, audio, and settings
- **Latest**: Empty state options for AI generation or manual writing
- **Latest**: Slash command (/) for quick content generation
- **Latest**: Enhanced text editing with proper cursor management

## Tech Stack
- Next.js 14 (App Router) + React 18
- Tailwind CSS + shadcn/ui
- Dexie (IndexedDB)
- OpenAI Chat Completions
- ElevenLabs Text-to-Speech

## Requirements
- Node.js 18+

## Setup
```bash
npm install
# optional
# echo 'NEXT_PUBLIC_APP_NAME="Story Narration App"' > .env.local
npm run dev
```
Open http://localhost:3000

## API Keys
- Click "API Keys" in the header to enter your OpenAI and ElevenLabs keys.
- Keys are stored in the browser (IndexedDB → `settings`).

## Usage
- **Text Editing**: Select text in the editor; a popover appears near the selection.
- **AI Instructions**: Enter an instruction (e.g., "Make this more dramatic"). Only the selected range is replaced.
- **Story Context**: Add story-wide guidelines in the "Story Context" tab (auto-saves when you click outside).
- **Version History**: Manage and revert changes in "Version History" (hover to see revert options).
- **Audio Generation**: Choose a voice and click "Generate Audio" to create narration.
- **Empty State**: When the editor is empty, choose "Generate a basic story with AI" or "Write on my own".
- **Slash Command**: Press `/` anywhere in the editor to generate content at that position.

## Recent Improvements
- **UI/UX Enhancements:**
  - Removed headings from sidebar components for cleaner appearance
  - Story context is always editable with auto-save functionality
  - Enhanced text editing with proper cursor management
  - Fixed port conflicts and server stability
  - Improved selection preservation when interacting with popovers
- **Technical Improvements:**
  - Better contentEditable handling to prevent cursor jumping
  - Auto-save on input for real-time updates
  - Enhanced popover interaction to maintain text selection
  - Improved error handling and build stability

## Troubleshooting
- Port busy:
```bash
lsof -n -iTCP:3000 -sTCP:LISTEN | awk 'NR>1 {print $2}' | xargs -r kill -9
```
- Cache/module issues:
```bash
rm -rf .next node_modules
npm install
npm run dev
```
- Upgrade Next.js/React (optional):
```bash
npm i next@latest react@latest react-dom@latest
```

## Build
```bash
npm run build
```

## APIs & Endpoints
- OpenAI (Chat Completions)
  - Base: `https://api.openai.com/v1`
  - POST `chat/completions` – used for story generation, selection edits, and slash commands
- ElevenLabs
  - Base: `https://api.elevenlabs.io/v1`
  - GET `voices` – fetch available voices
  - POST `text-to-speech/{voice_id}` – generate audio from text

## Folder Structure
```
src/
├─ app/                    # Next.js App Router
├─ components/             # React components
│  ├─ ui/                 # shadcn/ui components
│  ├─ Header.tsx          # App header with API keys
│  ├─ StoryEditor.tsx     # Main text editor
│  ├─ PromptBox.tsx       # Selection-based edit popover
│  ├─ ContextualPrompt.tsx # Story context editor
│  ├─ VersionHistory.tsx  # Version management
│  ├─ BottomBar.tsx       # Audio controls
│  └─ GenerateStoryDialog.tsx # AI story generation modal
├─ lib/                   # Utilities and API clients
└─ types/                 # TypeScript definitions
```
