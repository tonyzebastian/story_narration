export interface StoryVersion {
  id: string;
  storyId: string;
  content: string;
  parentVersionId?: string;
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

export interface AudioFile {
  id: string;
  storyId: string;
  versionId: string;
  voiceId: string;
  audioBlob: Blob;
  duration: number;
  createdAt: Date;
}

export interface AppSettings {
  id: 'settings';
  openaiApiKey?: string;
  elevenlabsApiKey?: string;
  selectedVoice?: string;
  preferences: {
    autoSave: boolean;
    maxVersionHistory: number;
  };
}

export interface TTSOptions {
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  outputFormat?: string;
}

export interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
}

