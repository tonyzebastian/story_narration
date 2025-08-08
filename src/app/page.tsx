'use client';

import { useEffect, useMemo, useState } from 'react';
import StoryEditor from '@/components/StoryEditor';
import VersionHistory from '@/components/VersionHistory';
import Header from '@/components/Header';
import BottomBar from '@/components/BottomBar';
import ContextualPrompt from '@/components/ContextualPrompt';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ElevenLabsClient } from '@/lib/elevenlabs';
import { db } from '@/lib/database';
import type { AppSettings, Story } from '@/types';

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
        } else {
          // Create a new empty story
          const newStory = { ...defaultStory, id: crypto.randomUUID() };
          await db.stories.put(newStory);
          setStory(newStory);
        }
      } else {
        await db.stories.put(defaultStory);
        setStory(defaultStory);
      }
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

  // Debug function to clear database (for testing)
  const clearDatabase = async () => {
    await db.stories.clear();
    await db.versions.clear();
    await db.audioFiles.clear();
    window.location.reload();
  };

  return (
    <div className="pb-24">
      <Header
        appName={process.env.NEXT_PUBLIC_APP_NAME || 'Story Narration App'}
        openaiKey={settings?.openaiApiKey}
        elevenlabsKey={settings?.elevenlabsApiKey}
        onSaveKeys={handleSaveKeys}
        onClearDatabase={clearDatabase}
      />

      <main className="w-full px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,380px] xl:grid-cols-[1fr,420px]">
          <div className="min-w-0">
            {story && (
              <StoryEditor
                story={story}
                onStoryUpdate={handleStoryUpdate}
                openaiApiKey={openaiKey}
                contextualPrompt={story.contextualPrompt}
              />
            )}
          </div>
          <aside className="lg:border-l lg:pl-6 min-w-0">
            <Tabs defaultValue="context">
              <TabsList className="w-full">
                <TabsTrigger className="flex-1" value="context">Story Context</TabsTrigger>
                <TabsTrigger className="flex-1" value="versions">Version History</TabsTrigger>
              </TabsList>
              <TabsContent value="context">
                {story && (
                  <ContextualPrompt
                    value={story.contextualPrompt || ''}
                    onChange={async (newVal) => {
                      setStory((s) => (s ? { ...s, contextualPrompt: newVal } : s));
                      await handleStoryUpdate(story.content, { type: 'contextual-prompt-update', contextualPrompt: newVal });
                    }}
                    placeholder="Add story-wide guidelines"
                  />
                )}
              </TabsContent>
              <TabsContent value="versions">
                {story && (
                  <VersionHistory
                    versions={story.versions || []}
                    currentVersionId={story.currentVersionId}
                    onRevert={async (versionId) => {
                      const v = (story.versions || []).find((x) => x.id === versionId);
                      if (!v) return;
                      await handleStoryUpdate(v.content, { type: 'user' });
                    }}
                  />
                )}
              </TabsContent>
            </Tabs>
          </aside>
        </div>
      </main>

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
      />
    </div>
  );
}


