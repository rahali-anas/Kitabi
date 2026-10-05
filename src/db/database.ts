import Dexie, { type Table } from 'dexie';

export interface Project {
  id: string;
  name: string;
  type: 'story' | 'diary' | 'journal';
  hasPowerSystem: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Chapter {
  id: string;
  projectId: string;
  title: string;
  body: string;
  order: number;
  status: 'draft' | 'revising' | 'done';
  mentionedChars: string[];
  snapshots: { ts: number; title: string; body: string }[];
  created: number;
  updated: number;
}

export interface Character {
  id: string;
  projectId: string;
  name: string;
  title: string;
  age: string;
  sex: string;
  race: string;
  powers: string[];
  relations: { type: string; targetId: string }[];
  lore: string;
  portrait: string;
}

export interface Storyline {
  id: string;
  projectId: string;
  title: string;
  year: number;
  description: string;
  mentionedChars: string[];
}

export interface Note {
  id: string;
  projectId: string;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  created: number;
  updated: number;
}

export interface MediaAsset {
  id: string;
  projectId: string;
  name: string;
  type: 'image' | 'audio' | 'video';
  blob: Blob;
  tags: string[];
  created: number;
}

export interface PowerEntry {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  subEntries: string;
}

export interface PowerCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  entries: PowerEntry[];
}

export interface PowerSystem {
  id: string;
  projectId: string;
  systemName: string;
  systemDesc: string;
  categories: PowerCategory[];
  notes: string[];
  updated: number;
}
export class StoryDatabase extends Dexie {
  projects!: Table<Project, string>;
  chapters!: Table<Chapter, string>;
  characters!: Table<Character, string>;
  storylines!: Table<Storyline, string>;
  notes!: Table<Note, string>;
  media!: Table<MediaAsset, string>;
  powerSystems!: Table<PowerSystem, string>;

  constructor() {
    super('StoryWorkstation');
    this.version(1).stores({
      projects: 'id, name, updatedAt',
      chapters: 'id, projectId, order, updatedAt',
      characters: 'id, projectId, name',
      storylines: 'id, projectId, year',
      notes: 'id, projectId, updatedAt',
      media: 'id, projectId, type',
    });
    this.version(2).stores({
      projects: 'id, name, updatedAt',
      chapters: 'id, projectId, order, updatedAt',
      characters: 'id, projectId, name',
      storylines: 'id, projectId, year',
      notes: 'id, projectId, updatedAt',
      media: 'id, projectId, type',
      powerSystems: 'id, projectId',
    });
    this.version(3)
      .stores({
        projects: 'id, name, updatedAt, type',
        chapters: 'id, projectId, order, updatedAt',
        characters: 'id, projectId, name',
        storylines: 'id, projectId, year',
        notes: 'id, projectId, updatedAt',
        media: 'id, projectId, type',
        powerSystems: 'id, projectId',
      })
      .upgrade(async (tx) => {
        // Backfill existing rows with type: 'story'
        await tx.table('projects').toCollection().modify((p: any) => {
          if (!p.type) p.type = 'story';
        });
      });
  }
}

export const db = new StoryDatabase();