/**
 * The bottle's and the cake's labels are read from the story's own sentences, in
 * every locale, by punctuation and case alone. The sentences come from the text
 * layer and the beats from the demo's composition, as at runtime.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { labelIn, setApart } from './label.ts';

const root = join(import.meta.dirname, '..', '..', '..');
const demo = JSON.parse(
  readFileSync(join(root, 'experience', 'demos', 'drink-me.demo.json'), 'utf8'),
) as { shots: { beats: { cue?: string; segments: string[] }[] }[] };
const beat = (cue: string): string[] =>
  demo.shots.flatMap((shot) => shot.beats).find((candidate) => candidate.cue === cue)?.segments ??
  [];
const locales = readdirSync(join(root, 'text', 'locales'));
const sentences = (locale: string): Record<string, string> =>
  (
    JSON.parse(readFileSync(join(root, 'text', 'locales', locale, 'ch01.json'), 'utf8')) as {
      segments: Record<string, string>;
    }
  ).segments;

describe('the labels on the bottle and the cake', () => {
  it('finds quoted words in any kind of quotation mark, and runs of capitals', () => {
    expect(setApart('x «AB cd» y')).toBe('AB cd');
    expect(setApart('x “ab” y')).toBe('ab');
    expect(setApart('x 「ab cd」 y')).toBe('ab cd');
    expect(setApart('Ab XY ZW cd')).toBe('XY ZW');
    expect(setApart('Ab cd. Ef gh.')).toBe('');
    expect(setApart('x "" y')).toBe('');
  });

  for (const locale of locales) {
    it(`reads a label for each from the ${locale} sentences`, () => {
      const text = sentences(locale);
      for (const cue of ['bottle', 'cake']) {
        const lines = beat(cue).map((id) => ({ textContent: text[id] ?? null }));
        expect(lines.length, `${cue} beat`).toBeGreaterThan(0);
        const label = labelIn(lines);
        expect(label, `${locale} ${cue}`).not.toBe('');
        // A few words written on a thing, taken from one of its sentences.
        const source = lines.find((line) => line.textContent?.includes(label))?.textContent ?? '';
        expect(source, `${locale} ${cue}`).not.toBe('');
        expect(label.length).toBeLessThan(source.length / 2);
      }
    });
  }
});
