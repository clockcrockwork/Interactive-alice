/**
 * The tale's lines in groups for the tail, in every locale: the English groups
 * are the book's three or four words, and a script of wide glyphs gets groups of
 * fewer words, about as wide.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chunksOf, emWidth } from './chunks.ts';

const root = join(import.meta.dirname, '..', '..', '..');
const demo = JSON.parse(
  readFileSync(join(root, 'experience', 'demos', 'mouse-tale.demo.json'), 'utf8'),
) as { shots: { beats: { cue?: string; segments: string[] }[] }[] };
const verseIds = demo.shots
  .flatMap((shot) => shot.beats)
  .filter((beat) => beat.cue?.startsWith('fury-'))
  .flatMap((beat) => beat.segments);
const locales = readdirSync(join(root, 'text', 'locales'));
const sentences = (locale: string): Record<string, string> =>
  (
    JSON.parse(readFileSync(join(root, 'text', 'locales', locale, 'ch03.json'), 'utf8')) as {
      segments: Record<string, string>;
    }
  ).segments;

describe("the Mouse's tale in groups for the tail", () => {
  it('groups by words and by width, and never leaves one word alone at the end', () => {
    expect(chunksOf('aaaa bb c dd eee ff g hh ii jjj k', 4, 12.5)).toEqual([
      'aaaa bb c dd',
      'eee ff g hh',
      'ii jjj k',
    ]);
    // Width caps a group before the word count does.
    expect(chunksOf('aaaaaaaaaa bbbbbbbbbb cc', 4, 6)).toEqual(['aaaaaaaaaa', 'bbbbbbbbbb cc']);
    expect(chunksOf('a b c d e', 4, 12.5)).toEqual(['a b c d e']);
    expect(emWidth('ab')).toBe(1);
    // Full-width forms count as wide; so do kana and ideographs (the WIDE ranges).
    expect(emWidth('\uff21\uff22')).toBe(2);
    // A comma with no space after it is a place to break; its own glue is kept.
    expect(chunksOf('\uff21\uff21\uff21\uff21\u3001\uff22\uff22\uff22\uff22 \uff23', 4, 5)).toEqual(
      ['\uff21\uff21\uff21\uff21\u3001', '\uff22\uff22\uff22\uff22 \uff23'],
    );
  });

  for (const locale of locales) {
    it(`keeps every word of the ${locale} verses, in order, in groups near the book's measure`, () => {
      const text = sentences(locale);
      for (const [perChunk, maxEms] of [
        [4, 12.5],
        [3, 9],
      ] as const) {
        for (const id of verseIds) {
          const line = text[id] ?? '';
          const groups = chunksOf(line, perChunk, maxEms);
          expect(groups.join(' ').replace(/\s+/g, ''), id).toBe(line.replace(/\s+/g, ''));
          for (const group of groups) {
            // Only a single word wider than the measure may stand wider than it.
            const single = !/[\s\u3001\uff0c]./u.test(group);
            if (!single) {
              expect(emWidth(group), `${locale} ${id} ${group}`).toBeLessThanOrEqual(maxEms * 1.25);
            }
          }
        }
      }
    });
  }
});
