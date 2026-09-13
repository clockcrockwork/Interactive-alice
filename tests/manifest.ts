import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PageEntry } from '../build/pages.ts';
import type { SceneMapping } from '../src/runtime/pacing.ts';
import type { ExperienceStoryFile } from '../src/types/schema.ts';

/**
 * The page graph the build generated, so the browser tests cover the real pages
 * instead of a second list that drifts. Run `npm run build` first.
 */
export function pageGraph(): PageEntry[] {
  const file = join(import.meta.dirname, '..', 'src', 'generated', 'manifest.json');
  try {
    return (JSON.parse(readFileSync(file, 'utf8')) as { pages: PageEntry[] }).pages;
  } catch {
    throw new Error(`no page manifest at ${file}; run npm run build first`);
  }
}

export const locales = (): string[] =>
  pageGraph()
    .filter((page) => page.kind === 'locale')
    .map((page) => page.locale ?? '');

/** The sentences a locale actually authored, straight from the text layer. */
export function sentencesOf(locale: string, segmentIds: readonly string[]): Record<string, string> {
  const chapters = new Set(segmentIds.map((id) => id.slice(2, 4)));
  const text: Record<string, string> = {};
  for (const chapter of chapters) {
    const file = join(import.meta.dirname, '..', 'text', 'locales', locale, `ch${chapter}.json`);
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as { segments: Record<string, string> };
    Object.assign(text, parsed.segments);
  }
  return text;
}

/**
 * One scene's mapping, read from `experience/`.
 *
 * The mapping is the only list of shots and beats, so a browser test that needs to
 * know what a scene declares reads it from there rather than repeating it. See
 * CLAUDE.md, "One shot list".
 */
export function sceneOf(sceneId: string): SceneMapping {
  const root = join(import.meta.dirname, '..');
  const story = JSON.parse(
    readFileSync(join(root, 'experience', 'story.json'), 'utf8'),
  ) as ExperienceStoryFile;
  const entry = story.scenes.find((scene) => scene.id === sceneId);
  if (!entry) {
    throw new Error(`experience/story.json lists no scene ${sceneId}`);
  }
  return JSON.parse(readFileSync(join(root, entry.file), 'utf8')) as SceneMapping;
}
