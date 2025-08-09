'use client';

import { useEffect, useMemo, useState } from 'react';
import StoryEditor from '@/components/StoryEditor';
import Header from '@/components/Header';
import BottomBar from '@/components/BottomBar';
import ContextualPrompt from '@/components/ContextualPrompt';
import { ElevenLabsClient } from '@/lib/elevenlabs';
import { db } from '@/lib/database';
import type { AppSettings, Story, AudioFile } from '@/types';

export const dynamic = 'force-dynamic';

export default function Page() {
  const defaultStory: Story = {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`,
    title: 'Untitled Story',
    content: '',
    contextualPrompt: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    versions: [
      {
        id: 'initial',
        storyId: 'initial',
        content: '',
        timestamp: new Date(),
        editType: 'initial',
      },
    ],
    currentVersionId: 'initial',
  } as Story;

  const [story, setStory] = useState<Story | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [audioGenerationCount, setAudioGenerationCount] = useState(0);

  useEffect(() => {
    const init = async () => {
      const existingSettings = (await db.settings.get('settings')) || {
        id: 'settings',
        preferences: { autoSave: true, maxVersionHistory: 50 },
      };
      setSettings(existingSettings);
      if (!existingSettings.id) await db.settings.put(existingSettings);

      const storedStories = await db.stories.toArray();
      if (storedStories.length > 0) {
        const firstStory = storedStories[0];
        // If the story has content, use it; otherwise create a new empty story
        if (firstStory.content && firstStory.content.trim()) {
          setStory(firstStory);
          // Set current version index to the latest version
          setCurrentVersionIndex(Math.max(0, (firstStory.versions?.length || 1) - 1));
        } else {
          // Create a new empty story
          const newStory = { ...defaultStory, id: crypto.randomUUID() };
          await db.stories.put(newStory);
          setStory(newStory);
          setCurrentVersionIndex(0);
        }
      } else {
        await db.stories.put(defaultStory);
        setStory(defaultStory);
        setCurrentVersionIndex(0);
      }
    };
    void init();
  }, []);

  const openaiKey = useMemo(() => settings?.openaiApiKey, [settings]);

  const handleStoryUpdate = async (
    newContent: string,
    meta: { type: string; prompt?: string; editedRange?: { start: number; end: number }; contextualPrompt?: string; createVersion?: boolean },
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
    
    // Only create version if explicitly requested or for non-user-input types
    if (meta.createVersion || meta.type !== 'user-input') {
      const versionId = crypto.randomUUID();
      const newVersion = {
        id: versionId,
        storyId: updated.id,
        content: newContent,
        timestamp: new Date(),
        editType: meta.type === 'user-input' ? 'user' : 'gpt',
        editPrompt: meta.prompt,
        editedRange: meta.editedRange,
      };
      
      await db.versions.put(newVersion as any);
      updated.currentVersionId = versionId;
      updated.versions = [...(updated.versions || []), newVersion as any];
      await db.stories.put(updated);
      
      // Update current version index to the latest
      setCurrentVersionIndex(updated.versions.length - 1);
    }
  };

  const handleGenerateAudio = async () => {
    if (!story || !settings?.elevenlabsApiKey) return;
    setIsGeneratingAudio(true);
    try {
      const el = new ElevenLabsClient(settings.elevenlabsApiKey);
      const voiceId = settings.selectedVoice || '21m00Tcm4TlvDq8ikWAM';
      const blob = await el.textToSpeech(story.content, voiceId);
      setAudioBlob(blob);
      
      // Save to database
      const audioFile = {
        id: crypto.randomUUID(),
        storyId: story.id,
        versionId: story.currentVersionId,
        voiceId,
        audioBlob: blob,
        duration: 0, // We'll calculate this when the audio loads
        createdAt: new Date(),
      };
      await db.audioFiles.put(audioFile);
      setAudioGenerationCount(prev => prev + 1);
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

  // Version navigation functions
  const handleGoBack = async () => {
    if (!story || currentVersionIndex <= 0) return;
    const newIndex = currentVersionIndex - 1;
    const targetVersion = story.versions[newIndex];
    if (targetVersion) {
      const updated = { ...story, content: targetVersion.content, currentVersionId: targetVersion.id };
      setStory(updated);
      setCurrentVersionIndex(newIndex);
      await db.stories.put(updated);
    }
  };

  const handleGoForward = async () => {
    if (!story || currentVersionIndex >= story.versions.length - 1) return;
    const newIndex = currentVersionIndex + 1;
    const targetVersion = story.versions[newIndex];
    if (targetVersion) {
      const updated = { ...story, content: targetVersion.content, currentVersionId: targetVersion.id };
      setStory(updated);
      setCurrentVersionIndex(newIndex);
      await db.stories.put(updated);
    }
  };

  // Debug function to clear database (for testing)
  const clearDatabase = async () => {
    await db.stories.clear();
    await db.versions.clear();
    await db.audioFiles.clear();
    window.location.reload();
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <Header
        appName={process.env.NEXT_PUBLIC_APP_NAME || 'Story Narration App'}
        openaiKey={settings?.openaiApiKey}
        elevenlabsKey={settings?.elevenlabsApiKey}
        onSaveKeys={handleSaveKeys}
        onClearDatabase={clearDatabase}
        canGoBack={currentVersionIndex > 0}
        canGoForward={story ? currentVersionIndex < story.versions.length - 1 : false}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
      />

      {/* Main content area - text area and sidebar */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] xl:grid-cols-[1fr,420px] h-full">
          <div className="min-w-0 px-4 md:px-6 py-6 overflow-auto">
            {story && (
              <StoryEditor
                story={story}
                onStoryUpdate={handleStoryUpdate}
                openaiApiKey={openaiKey}
                contextualPrompt={story.contextualPrompt}
              />
            )}
          </div>
          <aside className="lg:border-l lg:pl-6 lg:pr-4 md:pr-6 py-6 min-w-0 h-full overflow-hidden">
            {story && (
              <ContextualPrompt
                value={story.contextualPrompt || ''}
                onChange={async (newVal) => {
                  setStory((s) => (s ? { ...s, contextualPrompt: newVal } : s));
                  await handleStoryUpdate(story.content, { type: 'contextual-prompt-update', contextualPrompt: newVal });
                }}
              />
            )}
          </aside>
        </div>
      </div>

      {/* Footer/Bottom bar */}
      <BottomBar
        elevenApiKey={settings?.elevenlabsApiKey}
        selectedVoice={settings?.selectedVoice}
        onSelectVoice={async (vid) => {
          const updated = { ...(settings as AppSettings), selectedVoice: vid } as AppSettings;
          setSettings(updated);
          await db.settings.put(updated);
        }}
        audioBlob={audioBlob}
        onGenerateAudio={handleGenerateAudio}
        isGenerating={isGeneratingAudio}
        storyId={story?.id}
        audioGenerationCount={audioGenerationCount}
        storyContent={story?.content}
      />
    </div>
  );
}


