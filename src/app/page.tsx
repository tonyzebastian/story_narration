'use client';

import { useEffect, useMemo, useState } from 'react';
import StoryEditor from '@/components/StoryEditor';
import AudioPlayer from '@/components/AudioPlayer';
import VoiceSelector from '@/components/VoiceSelector';
import VersionHistory from '@/components/VersionHistory';
import ApiKeyManager from '@/components/ApiKeyManager';
import { ElevenLabsClient } from '@/lib/elevenlabs';
import { db } from '@/lib/database';
import type { AppSettings, Story } from '@/types';

export default function Page() {
  const defaultStory: Story = {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`,
    title: 'Untitled Story',
    content: 'Select any text to begin editing with GPT...',
    contextualPrompt: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    versions: [
      {
        id: 'initial',
        storyId: 'initial',
        content: 'Select any text to begin editing with GPT...',
        timestamp: new Date(),
        editType: 'initial',
      },
    ],
    currentVersionId: 'initial',
  } as Story;

  const [story, setStory] = useState<Story | null>(defaultStory);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const init = async () => {
      const existingSettings = (await db.settings.get('settings')) || {
        id: 'settings',
        preferences: { autoSave: true, maxVersionHistory: 50 },
      };
      setSettings(existingSettings);
      if (!existingSettings.id) await db.settings.put(existingSettings);

      const storedStories = await db.stories.toArray();
      if (storedStories.length > 0) setStory(storedStories[0]);
      else await db.stories.put(defaultStory);
    };
    void init();
  }, []);

  const openaiKey = useMemo(() => settings?.openaiApiKey, [settings]);

  const handleStoryUpdate = async (
    newContent: string,
    meta: { type: string; prompt?: string; editedRange?: { start: number; end: number }; contextualPrompt?: string },
  ) => {
    if (!story) return;
    const updated: Story = {
      ...story,
      content: newContent,
      contextualPrompt: meta.contextualPrompt ?? story.contextualPrompt,
      updatedAt: new Date(),
    };
    setStory(updated);
    await db.stories.put(updated);
    const versionId = crypto.randomUUID();
    await db.versions.put({
      id: versionId,
      storyId: updated.id,
      content: newContent,
      timestamp: new Date(),
      editType: 'gpt',
      editPrompt: meta.prompt,
      editedRange: meta.editedRange,
    } as any);
    updated.currentVersionId = versionId;
    updated.versions = [...(updated.versions || []), {
      id: versionId,
      storyId: updated.id,
      content: newContent,
      timestamp: new Date(),
      editType: 'gpt',
      editPrompt: meta.prompt,
      editedRange: meta.editedRange,
    } as any];
    await db.stories.put(updated);
  };

  const handleGenerateAudio = async () => {
    if (!story || !settings?.elevenlabsApiKey) return;
    setIsGeneratingAudio(true);
    try {
      const el = new ElevenLabsClient(settings.elevenlabsApiKey);
      const voiceId = settings.selectedVoice || '21m00Tcm4TlvDq8ikWAM';
      const blob = await el.textToSpeech(story.content, voiceId);
      setAudioBlob(blob);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleSaveKeys = async (openaiApiKey: string, elevenlabsApiKey: string) => {
    const updated: AppSettings = {
      id: 'settings',
      ...settings,
      openaiApiKey,
      elevenlabsApiKey,
      preferences: settings?.preferences || { autoSave: true, maxVersionHistory: 50 },
    } as AppSettings;
    setSettings(updated);
    await db.settings.put(updated);
  };

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">{process.env.NEXT_PUBLIC_APP_NAME || 'Story Narration App'}</h1>

      <ApiKeyManager
        initialOpenAIKey={settings?.openaiApiKey}
        initialElevenLabsKey={settings?.elevenlabsApiKey}
        onSave={handleSaveKeys}
      />

      {story && (
        <div className="space-y-4">
          <StoryEditor story={story} onStoryUpdate={handleStoryUpdate} openaiApiKey={openaiKey} />
          <VersionHistory
            versions={story.versions || []}
            currentVersionId={story.currentVersionId}
            onRevert={async (versionId) => {
              const v = (story.versions || []).find((x) => x.id === versionId);
              if (!v) return;
              await handleStoryUpdate(v.content, { type: 'user' });
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <VoiceSelector apiKey={settings?.elevenlabsApiKey} selectedVoiceId={settings?.selectedVoice} onChange={async (vid) => {
          const updated = { ...(settings as AppSettings), selectedVoice: vid } as AppSettings;
          setSettings(updated);
          await db.settings.put(updated);
        }} />
        <AudioPlayer audioBlob={audioBlob} onGenerateAudio={handleGenerateAudio} isGenerating={isGeneratingAudio} />
      </div>
    </main>
  );
}


