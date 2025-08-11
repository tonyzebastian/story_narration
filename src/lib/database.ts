import Dexie, { Table } from 'dexie';
import type { AppSettings, AudioFile, Story, StoryVersion } from '@/types';

export class StoryDatabase extends Dexie {
  stories!: Table<Story, string>;
  versions!: Table<StoryVersion, string>;
  audioFiles!: Table<AudioFile, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('ScriptFlowApp');

    this.version(1).stores({
      stories: 'id, title, createdAt, updatedAt',
      versions: 'id, storyId, timestamp, parentVersionId',
      audioFiles: 'id, storyId, versionId, voiceId, createdAt',
      settings: 'id',
    });

    this.stories.hook('updating', function (modifications) {
      (modifications as Partial<Story>).updatedAt = new Date();
    });
  }
}

export const db = new StoryDatabase();

