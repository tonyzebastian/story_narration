# ScriptFlow - AI Story Creation & Voice Narration

![ScriptFlow Preview](https://scriptflow.vercel.app/preview.png)

ScriptFlow blends AI-powered writing assistance with ElevenLabs' lifelike voice narration, so you can write, refine, and hear your stories all in one place. Whether you're crafting a novel, a podcast script, or a YouTube voiceover, ScriptFlow keeps you in the creative flow.

## ✨ Key Features

### **AI-Powered Writing**
- **Selection-based editing**: Select text and provide natural language instructions for AI modifications
- **Slash commands**: Press `/` anywhere to generate content at that position
- **Contextual guidelines**: Set story-wide context that influences all AI edits
- **Smart generation**: AI story generation with customizable context and prompts

### **Professional Voice Narration**
- **ElevenLabs integration**: High-quality text-to-speech with multiple voice options
- **Audio management**: Play, pause, and download generated narrations
- **Previous generations**: Access and replay all your audio versions
- **Individual downloads**: Save specific generations with smart file naming

### **Seamless Workflow**
- **Real-time persistence**: Content automatically saved across browser sessions
- **Version history**: Track changes with ability to revert to previous versions
- **Responsive design**: Clean, distraction-free interface that works on all devices
- **No server required**: Everything runs locally in your browser

## Tech Stack
- Next.js 14 (App Router) + React 18
- Tailwind CSS + shadcn/ui
- Dexie (IndexedDB)
- OpenAI Chat Completions
- ElevenLabs Text-to-Speech

## Requirements
- Node.js 18+

## 🚀 Quick Start

```bash
# Clone and install
git clone <repository-url>
cd scriptflow
npm install

# Optional: Set app name
echo 'NEXT_PUBLIC_APP_NAME="ScriptFlow"' > .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 API Keys Setup

1. **Click "Settings"** in the header to open the API keys panel
2. **Add your keys**:
   - **OpenAI API Key**: For AI writing assistance (get from [OpenAI](https://platform.openai.com/api-keys))
   - **ElevenLabs API Key**: For voice narration (get from [ElevenLabs](https://elevenlabs.io/))
3. **Secure storage**: Keys are stored locally in your browser (IndexedDB) and never sent to our servers

## 📝 How to Use

### **Getting Started**
1. **Click "ScriptFlow"** in the header to see the welcome guide
2. **Add your API keys** in Settings
3. **Start writing** or generate a story with AI

### **Writing & Editing**
- **Select text** → Edit popover appears with AI assistance
- **Press `/`** → Generate content at cursor position  
- **Use Context for AI** → Set guidelines that influence all AI edits
- **Generate Story** → Create complete stories from prompts

### **Audio & Narration**
- **Choose a voice** from the ElevenLabs voice selector
- **Click Generate** to create narration of your story
- **Play/pause** audio with the main control button
- **Access previous generations** from the dropdown menu
- **Download audio** files individually or get the latest version

### **Version Management**
- **Auto-save**: Content is automatically saved as you type
- **Version history**: Track all changes in the sidebar
- **Revert changes**: Click any version to restore it

## 🆕 Latest Updates

### **Enhanced Audio Experience**
- **Individual audio controls**: Play/pause each generation independently
- **Smart downloads**: Download latest or specific generations with descriptive filenames
- **Improved playback**: Better audio state management and visual feedback

### **Persistent Content**
- **Dual storage system**: IndexedDB + localStorage backup for maximum reliability
- **Cross-session persistence**: Content survives browser refreshes and restarts
- **Smart recovery**: Automatically uses the most recent version on startup

### **Polished Interface**
- **Loading indicators**: Spinner icons in all generate buttons
- **Keyboard shortcuts**: ESC to close popovers and dialogs
- **Better error handling**: Clear API key warnings and status messages
- **Responsive design**: Optimized for desktop and mobile devices

## 🛠️ Development

### **Available Scripts**
```bash
npm run dev          # Start development server
npm run build        # Production build  
npm run start        # Start production server
npm run lint         # Run ESLint
```

### **Troubleshooting**
```bash
# Port conflicts
lsof -n -iTCP:3000 -sTCP:LISTEN | awk 'NR>1 {print $2}' | xargs -r kill -9

# Clean rebuild
rm -rf .next node_modules
npm install
npm run dev

# Update dependencies (optional)
npm i next@latest react@latest react-dom@latest
```

### **Environment Variables**
```bash
# .env.local (optional)
NEXT_PUBLIC_APP_NAME="ScriptFlow"
NEXT_PUBLIC_APP_URL="https://scriptflow.vercel.app"
```

## 🔗 API Integration

### **OpenAI API**
- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Model**: GPT-4o-mini for optimal performance and cost
- **Usage**: Story generation, text editing, content creation

### **ElevenLabs API**  
- **Voices**: `GET /v1/voices` - Fetch available voice options
- **TTS**: `POST /v1/text-to-speech/{voice_id}` - Generate audio narration
- **Format**: Returns high-quality audio files for download and playback

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⭐ Support

If you find ScriptFlow helpful, please consider giving it a star on GitHub!

## 🏗️ Architecture

### **Tech Stack**
- **Framework**: Next.js 14 with App Router
- **UI**: React 18 + TypeScript + Tailwind CSS
- **Components**: shadcn/ui (Radix UI primitives)
- **Storage**: Dexie (IndexedDB wrapper) for local persistence
- **AI**: OpenAI GPT-4o-mini for text generation
- **Voice**: ElevenLabs API for text-to-speech

### **Project Structure**
```
src/
├─ app/                     # Next.js App Router
│  ├─ favicon.ico          # Favicons and SEO assets
│  ├─ opengraph-image.png  # Social media preview
│  └─ layout.tsx           # Root layout with metadata
├─ components/
│  ├─ ui/                  # shadcn/ui base components
│  ├─ Header.tsx           # App header with settings
│  ├─ StoryEditor.tsx      # Main contentEditable editor
│  ├─ PromptBox.tsx        # AI editing popover
│  ├─ BottomBar.tsx        # Audio controls & downloads
│  ├─ GenerateStoryDialog.tsx # AI story generation
│  └─ WelcomeDialog.tsx    # Onboarding experience
├─ lib/
│  ├─ database.ts          # Dexie IndexedDB setup
│  ├─ openai.ts           # OpenAI API client
│  └─ elevenlabs.ts       # ElevenLabs API client
└─ types/
   └─ index.ts             # TypeScript definitions
```

### **Data Storage**
- **Stories**: Content, context, versions, metadata
- **Audio Files**: Generated narrations with voice info
- **Settings**: API keys, preferences, voice selection
- **Versions**: Complete edit history with revert capability
