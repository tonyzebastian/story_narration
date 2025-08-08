# Story Creation & Narration App (OpenAI + ElevenLabs)

A Next.js app to draft/edit stories with OpenAI, then generate narrated audio using ElevenLabs. It supports selection-based edits with contextual guidelines, version history, and simple audio playback with voice selection.

## Features
- Selection-based GPT edits with a sticky instruction popover
- Story-wide contextual guidelines guiding all edits
- Version history with revert
- ElevenLabs TTS: list voices, generate audio, and play
- Full-width header and bottom bar; editor + sidebar layout
- IndexedDB (Dexie) for stories, versions, audio, and settings

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
- Click “API Keys” in the header to enter your OpenAI and ElevenLabs keys.
- Keys are stored in the browser (IndexedDB → `settings`).

## Usage
- Select text in the editor; a popover appears near the selection.
- Enter an instruction (e.g., “Make this more dramatic”). Only the selected range is replaced.
- Add story-wide guidelines in the “Story Context” tab.
- Manage and revert changes in “Version History”.
- Choose a voice and click “Generate Audio” to create narration.

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
  - POST `chat/completions` – used for both story generation and selection edits
- ElevenLabs
  - Base: `https://api.elevenlabs.io/v1`
  - GET `voices` – fetch available voices
  - POST `text-to-speech/{voice_id}` – generate audio from text
