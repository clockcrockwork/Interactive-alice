/**
 * Reads the repository's data layers for the build.
 *
 * The text layer and the experience mapping are the sources of truth; nothing here
 * keeps its own list of locales, scenes, shots or beats. See
 * docs/text-experience-binding.md and docs/frontend-architecture.md §3.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SceneMapping } from '../src/runtime/pacing.ts';
import type {
  ChapterStructureFile,
  ExperienceStoryFile,
  LocaleChapterFile,
  LocaleRegistry,
  LocaleUIStrings,
} from '../src/types/schema.ts';
import { assertValid } from './schema.ts';

// Every shape below comes from schema/, generated into src/types/schema.ts by
// npm run types:schema. Nothing here retypes a schema by hand.
export type LocaleSettings = LocaleRegistry['locales'][string];
export type SegmentMeta = ChapterStructureFile['segments'][number];
export type ChapterText = LocaleChapterFile;
export type Part = NonNullable<ExperienceStoryFile['parts']>[number];
export type StoryFile = ExperienceStoryFile;
export type UIStrings = LocaleUIStrings['strings'];

export interface Project {
  /** The retelling every translation works from; missing text here is a hard error. */
  baseLocale: string;
  locales: Record<string, LocaleSettings>;
  parts: Part[];
  scenes: Map<string, SceneMapping>;
  /** Segment metadata by chapter number. */
  structure: Map<number, SegmentMeta[]>;
  /** Chapter text by locale, then by chapter number. */
  text: Map<string, Map<number, ChapterText>>;
  /**
   * What the site itself says, per locale.
   *
   * Required for every locale, unlike chapter text: a language may be behind on the
   * story, but the words around it cannot be half translated, or a reader meets a
   * page that cannot explain itself.
   */
  ui: Map<string, UIStrings>;
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
  const localeFile = read(root, 'text', 'locales.json') as LocaleRegistry;
  const story = read(root, 'experience', 'story.json') as StoryFile;

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

  const ui = new Map<string, UIStrings>();
  for (const locale of Object.keys(localeFile.locales)) {
    const path = join(root, 'text', 'locales', locale, 'ui.json');
    if (!existsSync(path)) {
      throw new Error(
        `${locale} has no text/locales/${locale}/ui.json; the UI copy is not optional`,
      );
    }
    const file = JSON.parse(readFileSync(path, 'utf8')) as LocaleUIStrings;
    // Shape first: a missing key here only shows up on the page that needs it, which
    // may be a page nobody is looking at today. The checker refuses the same file;
    // this is the half of that contract a remote build actually runs.
    assertValid(file, read(root, 'schema', 'ui-strings.schema.json'), `${locale}/ui.json`);
    if (file.locale !== locale) {
      throw new Error(`text/locales/${locale}/ui.json says locale ${file.locale}`);
    }
    ui.set(locale, file.strings);
  }

  const structure = new Map<number, SegmentMeta[]>();
  const text = new Map<string, Map<number, ChapterText>>();
  for (const chapter of chapters) {
    const name = `ch${String(chapter).padStart(2, '0')}`;
    const file = read(root, 'text', 'story', `${name}.structure.json`) as ChapterStructureFile;
    structure.set(chapter, [...file.segments]);

    for (const locale of Object.keys(localeFile.locales)) {
      const byChapter = text.get(locale) ?? new Map<number, ChapterText>();
      const file = join(root, 'text', 'locales', locale, `${name}.json`);
      // A translation may legitimately be behind: text/ is authored chapter by
      // chapter, so a missing file is data, not a failure. Who may be missing what is
      // decided when pages are generated.
      if (existsSync(file)) {
        byChapter.set(chapter, JSON.parse(readFileSync(file, 'utf8')) as ChapterText);
      }
      text.set(locale, byChapter);
    }
  }

  return {
    baseLocale: localeFile.baseLocale,
    locales: localeFile.locales,
    // Declared, never inferred: the schema requires parts for exactly this reason.
    parts: story.parts,
    scenes,
    structure,
    text,
    ui,
  };
}
