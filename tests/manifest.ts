import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PageEntry } from '../build/pages.ts';

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
