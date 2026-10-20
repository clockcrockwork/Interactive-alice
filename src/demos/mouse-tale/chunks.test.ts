/**
 * The tale's lines in groups for the tail, in every locale: the English groups
 * are the book's three or four words, and a script of wide glyphs gets groups of
 * fewer words, about as wide.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { LocaleRegistry } from '../../types/schema.ts';
import { joinUnits, type Unit, units } from '../shell/words.ts';
import {
  type ChunkProfile,
  chunksOf,
  emWidth,
  isWide,
  layTail,
  type TailMeasure,
  type TailPiece,
} from './chunks.ts';

const root = join(import.meta.dirname, '..', '..', '..');
const demo = JSON.parse(
  readFileSync(join(root, 'experience', 'demos', 'mouse-tale.demo.json'), 'utf8'),
) as { shots: { beats: { cue?: string; segments: string[] }[] }[] };
const verseIds = demo.shots
  .flatMap((shot) => shot.beats)
  .filter((beat) => beat.cue?.startsWith('fury-'))
  .flatMap((beat) => beat.segments);
const locales = readdirSync(join(root, 'text', 'locales'));
const registry = JSON.parse(
  readFileSync(join(root, 'text', 'locales.json'), 'utf8'),
) as LocaleRegistry;
const profileOf = (locale: string): ChunkProfile => {
  const settings = registry.locales[locale];
  if (!settings) {
    throw new Error(`no locale ${locale}`);
  }
  return {
    wordUnit: settings.wordUnit,
    tag: settings.numbers,
    glyphWidth: settings.glyphWidth,
    significantSpaces: settings.significantSpaces,
  };
};
const PHRASES: ChunkProfile = {
  wordUnit: 'spaces',
  tag: 'und',
  glyphWidth: 'full',
  significantSpaces: true,
};

/**
 * The book's grouping, as the tail first set it: units filled in reading order,
 * a lone last unit joined on. Where spaces are word spaces the groups must stay
 * exactly these.
 */
function bookGroups(text: string, perChunk: number, maxEms: number, profile: ChunkProfile) {
  const width = (group: readonly Unit[]) => emWidth(joinUnits(group), profile.glyphWidth);
  const groups: Unit[][] = [];
  let current: Unit[] = [];
  for (const unit of units(text, profile)) {
    const next = [...current, unit];
    if (current.length > 0 && (next.length > perChunk || width(next) > maxEms)) {
      groups.push(current);
      current = [unit];
    } else {
      current = next;
    }
  }
  if (current.length > 0) {
    groups.push(current);
  }
  const last = groups.at(-1);
  const before = groups.at(-2);
  if (last && before && last.length === 1 && width([...before, ...last]) <= maxEms * 1.25) {
    groups.pop();
    groups[groups.length - 1] = [...before, ...last];
  }
  return groups.map(joinUnits);
}
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

  it('where spaces are phrase spaces, parts at every pause, and splits a part evenly', () => {
    // Seven and five between commas: a group never runs on past a comma, and a
    // part too long for one group splits seven and five, not ten and two.
    expect(chunksOf('ＡＡ ＡＡＡ、ＢＢＢ ＢＢ ＢＢ。', 4, 12.5, PHRASES)).toEqual([
      'ＡＡ ＡＡＡ、',
      'ＢＢＢ ＢＢ ＢＢ。',
    ]);
    // Read by words, the same line runs on past its comma.
    expect(
      chunksOf('ＡＡ ＡＡＡ、ＢＢＢ ＢＢ ＢＢ。', 4, 12.5, {
        ...PHRASES,
        significantSpaces: false,
      }),
    ).toEqual(['ＡＡ ＡＡＡ、ＢＢＢ ＢＢ ＢＢ。']);
    expect(chunksOf('ＡＡＡＡＡＡＡ ＢＢＢ ＢＢ、ＣＣ', 4, 9, PHRASES)).toEqual([
      'ＡＡＡＡＡＡＡ',
      'ＢＢＢ ＢＢ、',
      'ＣＣ',
    ]);
    // Word spaces keep the book's grouping, commas or not.
    expect(chunksOf('Come, I will take no denial.', 4, 12.5)).toEqual([
      'Come, I will take',
      'no denial.',
    ]);
    // A quoted run is one unit, so no group ends inside it.
    expect(chunksOf('ＡＡ 「ＢＢ ＣＣ ＤＤ」 ＥＥ', 2, 5, PHRASES)).toEqual([
      'ＡＡ',
      '「ＢＢ ＣＣ ＤＤ」',
      'ＥＥ',
    ]);
  });

  for (const locale of locales) {
    const profile = profileOf(locale);
    it(`groups the ${locale} verses by the profile: the book's groups for word spaces, never past a pause for phrase spaces`, () => {
      const text = sentences(locale);
      for (const [perChunk, maxEms] of [
        [4, 12.5],
        [3, 9],
      ] as const) {
        for (const id of verseIds) {
          const line = text[id] ?? '';
          const groups = chunksOf(line, perChunk, maxEms, profile);
          if (!profile.significantSpaces) {
            expect(groups, `${locale} ${id}`).toEqual(bookGroups(line, perChunk, maxEms, profile));
            continue;
          }
          for (const group of groups) {
            const inside = units(group, profile).slice(0, -1);
            expect(
              inside.filter((unit) => unit.pause),
              `${locale} ${id}: ${group}`,
            ).toEqual([]);
          }
        }
      }
    });

    it(`keeps every word of the ${locale} verses, in order, in groups near the book's measure`, () => {
      const text = sentences(locale);
      for (const [perChunk, maxEms] of [
        [4, 12.5],
        [3, 9],
      ] as const) {
        for (const id of verseIds) {
          const line = text[id] ?? '';
          const groups = chunksOf(line, perChunk, maxEms, profile);
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

  /** The tail as the stage sets it on a wide frame. */
  const measure = (glyphWidth: TailMeasure['glyphWidth']): TailMeasure => ({
    base: 20,
    floor: 12.5,
    shrink: 0.955,
    lead: 26,
    pitch: (words) => (isWide(words) ? 1.7 : 1.4),
    glyphWidth,
    rowEms: 20,
    rowPieces: 2,
    minScale: 0.75,
  });
  const piecesOf = (locale: string): TailPiece[] => {
    const text = sentences(locale);
    const profile = profileOf(locale);
    return verseIds.flatMap((id, line) =>
      chunksOf(text[id] ?? '', 4, 12.5, profile).map((words) => ({ text: words, line })),
    );
  };

  for (const locale of locales) {
    it(`fits the ${locale} tail to its room: its finest groups where they fit, else fewer rows, else smaller`, () => {
      const pieces = piecesOf(locale);
      const m = measure(profileOf(locale).glyphWidth);
      const finest = layTail(pieces, Number.POSITIVE_INFINITY, m);
      // Room enough: one group to a row at the book's sizes, the groups untouched.
      expect(finest.level).toBe(0);
      expect(finest.scale).toBe(1);
      expect(finest.rows).toEqual(pieces.map((_, i) => [i]));
      expect(layTail(pieces, finest.height, m)).toEqual(finest);
      // Less room: neighbouring groups of one line share a row, in order, never two
      // lines on one row, and never more than two groups.
      const joined = layTail(pieces, finest.height - 1, m);
      expect(joined.level).toBe(1);
      expect(joined.rows.flat()).toEqual(pieces.map((_, i) => i));
      for (const row of joined.rows) {
        expect(row.length).toBeLessThanOrEqual(2);
        expect(new Set(row.map((k) => pieces[k]?.line)).size).toBe(1);
      }
      expect(joined.rows.length).toBeLessThan(finest.rows.length);
      if (joined.fits) {
        expect(joined.height).toBeLessThanOrEqual(finest.height - 1);
      }
      // Less still: the same rows, smaller, down to the floor; then said not to fit.
      const smaller = layTail(pieces, joined.height * 0.85, m);
      expect(smaller.level).toBe(1);
      expect(smaller.scale).toBeLessThan(1);
      expect(smaller.scale).toBeGreaterThanOrEqual(m.minScale);
      const none = layTail(pieces, 10, m);
      expect(none.fits).toBe(false);
      expect(none.scale).toBe(m.minScale);
    });
  }
});
