/**
 * Reads the repository's data layers for the build.
 *
 * The text layer and the experience mapping are the sources of truth; nothing here
 * keeps its own list of locales, scenes, shots or beats. See
 * docs/text-experience-binding.md and docs/frontend-architecture.md §3.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SceneMapping } from '../src/runtime/pacing.ts';

export interface LocaleSettings {
  name: string;
  nativeName: string;
  role: 'base' | 'translation';
  maxChars: number;
  status: 'in-progress' | 'complete';
  dir: 'ltr' | 'rtl';
  lineBreak: 'auto' | 'loose' | 'normal' | 'strict';
  significantSpaces: boolean;
  notes?: string;
}

export interface SegmentMeta {
  id: string;
  section: string;
  kind: 'narration' | 'dialogue' | 'thought' | 'sound';
  speaker?: string;
}

export interface ChapterText {
  title: string;
  sections: Record<string, string>;
  segments: Record<string, string>;
}

export interface Part {
  id: string;
  scenes: string[];
}

export interface Project {
  locales: Record<string, LocaleSettings>;
  parts: Part[];
  scenes: Map<string, SceneMapping>;
  /** Segment metadata by chapter number. */
  structure: Map<number, SegmentMeta[]>;
  /** Chapter text by locale, then by chapter number. */
  text: Map<string, Map<number, ChapterText>>;
}

const read = (root: string, ...parts: string[]): unknown =>
  JSON.parse(readFileSync(join(root, ...parts), 'utf8'));

export const chapterOf = (segmentId: string): number => Number(segmentId.slice(2, 4));

export function chaptersOf(scene: SceneMapping): number[] {
  const chapters = new Set<number>();
  for (const shot of scene.shots) {
    for (const beat of shot.beats) {
      for (const segment of beat.segments) {
        chapters.add(chapterOf(segment));
      }
    }
  }
  return [...chapters].sort((a, b) => a - b);
}

export function loadProject(root: string): Project {
  const localeFile = read(root, 'text', 'locales.json') as {
    locales: Record<string, LocaleSettings>;
  };
  const story = read(root, 'experience', 'story.json') as {
    scenes: { id: string; file: string }[];
    parts?: Part[];
  };

  const scenes = new Map<string, SceneMapping>();
  for (const entry of story.scenes) {
    scenes.set(entry.id, read(root, entry.file) as SceneMapping);
  }

  const chapters = new Set<number>();
  for (const scene of scenes.values()) {
    for (const chapter of chaptersOf(scene)) {
      chapters.add(chapter);
    }
  }

  const structure = new Map<number, SegmentMeta[]>();
  const text = new Map<string, Map<number, ChapterText>>();
  for (const chapter of chapters) {
    const name = `ch${String(chapter).padStart(2, '0')}`;
    const file = read(root, 'text', 'story', `${name}.structure.json`) as {
      segments: SegmentMeta[];
    };
    structure.set(chapter, file.segments);

    for (const locale of Object.keys(localeFile.locales)) {
      const byChapter = text.get(locale) ?? new Map<number, ChapterText>();
      byChapter.set(chapter, read(root, 'text', 'locales', locale, `${name}.json`) as ChapterText);
      text.set(locale, byChapter);
    }
  }

  return {
    locales: localeFile.locales,
    parts: story.parts ?? story.scenes.map((entry) => ({ id: entry.id, scenes: [entry.id] })),
    scenes,
    structure,
    text,
  };
}
