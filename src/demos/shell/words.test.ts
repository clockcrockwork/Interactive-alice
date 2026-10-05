/**
 * What the demos read out of the page's sentences, in every locale, by
 * punctuation and case alone. The sentences come from the text layer and the
 * beats from each demo's composition, as at runtime.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exclaims, lonelyLetter, namedWords, quoted, setApart } from './words.ts';

const root = join(import.meta.dirname, '..', '..', '..');
const locales = readdirSync(join(root, 'text', 'locales'));

interface Line {
  id: string;
  text: string;
  speaker?: string;
}

/** A demo's beat by cue, as the page would carry it in one locale. */
function beat(demo: string, cue: string, locale: string): Line[] {
  const file = JSON.parse(
    readFileSync(join(root, 'experience', 'demos', `${demo}.demo.json`), 'utf8'),
  ) as { shots: { beats: { cue?: string; segments: string[] }[] }[] };
  const ids =
    file.shots.flatMap((shot) => shot.beats).find((candidate) => candidate.cue === cue)?.segments ??
    [];
  return ids.map((id) => {
    const chapter = id.slice(0, 4);
    const text = JSON.parse(
      readFileSync(join(root, 'text', 'locales', locale, `${chapter}.json`), 'utf8'),
    ) as { segments: Record<string, string> };
    const structure = JSON.parse(
      readFileSync(join(root, 'text', 'story', `${chapter}.structure.json`), 'utf8'),
    ) as { segments: { id: string; speaker?: string }[] };
    return {
      id,
      text: text.segments[id] ?? '',
      speaker: structure.segments.find((segment) => segment.id === id)?.speaker,
    };
  });
}

describe('reading the words a sentence sets apart', () => {
  it('finds every quoted run, in any kind of quotation mark, in order', () => {
    expect(quoted('a 「bc」 d 「e f」')).toEqual(['bc', 'e f']);
    expect(quoted('x «AB cd» y “ef”')).toEqual(['AB cd', 'ef']);
    expect(quoted('x "" y 「')).toEqual([]);
    expect(setApart('Ab XY ZW cd')).toBe('XY ZW');
  });

  it('names what a sentence quotes, or else its long capitalised words', () => {
    expect(namedWords('We learned Reeling and Writhing, of course.')).toEqual([
      'Reeling',
      'Writhing',
    ]);
    expect(namedWords('Then Drawling. The Drawling-master came.')).toEqual([
      'Drawling',
      'Drawling',
    ]);
    // Quoted words win over capitals, so a quoted sentence names only those.
    expect(namedWords('Then “Mystery”, with Seaography.')).toEqual(['Mystery']);
    expect(namedWords('a 「bc」 and 「de」')).toEqual(['bc', 'de']);
    expect(namedWords('I said so.')).toEqual([]);
  });

  it('finds the letter named as a letter: a lone capital, or one quoted character', () => {
    expect(lonelyLetter(['Everything with an M.', 'Why with an M?', 'I said.'])).toBe('M');
    expect(lonelyLetter(['x 「a」 y', 'z 「a」', 'w 「bc」'])).toBe('a');
    expect(lonelyLetter(['nothing here'])).toBe('');
  });

  it('hears an exclamation in either width', () => {
    expect(exclaims('Off with her head!')).toBe(true);
    expect(exclaims('x！')).toBe(true);
    expect(exclaims('x.')).toBe(false);
  });

  for (const locale of locales) {
    it(`finds the Mock Turtle's subjects in the ${locale} sentences, each quoted or capitalised there`, () => {
      for (const cue of ['reeling', 'more', 'drawling', 'grief']) {
        const lines = beat('mock-turtle', cue, locale).filter(
          (line) => line.speaker === 'mock-turtle',
        );
        const words = lines.flatMap((line) => namedWords(line.text));
        expect(words.length, `${locale} ${cue}`).toBeGreaterThan(0);
        for (const word of words) {
          expect(lines.some((line) => line.text.includes(word))).toBe(true);
          expect(word.length).toBeLessThan(20);
        }
      }
      // The word the uglify beat argues about is one of the subjects on the sand.
      const subjects = beat('mock-turtle', 'reeling', locale)
        .filter((line) => line.speaker === 'mock-turtle')
        .flatMap((line) => namedWords(line.text));
      const argued = beat('mock-turtle', 'uglify', locale).flatMap((line) => namedWords(line.text));
      expect(
        argued.some((word) => subjects.includes(word)),
        locale,
      ).toBe(true);
    });

    it(`finds one letter the sisters drew with in the ${locale} sentences`, () => {
      const letter = lonelyLetter(beat('dormouse', 'doze', locale).map((line) => line.text));
      expect([...letter]).toHaveLength(1);
    });

    it(`finds the Duchess's morals in the ${locale} sentences, after a colon or as a sentence`, () => {
      for (const cue of ['chin', 'sense', 'feather', 'mine', 'seem']) {
        const hers = beat('duchess', cue, locale).filter((line) => line.speaker === 'duchess');
        expect(hers.length, `${locale} ${cue}`).toBeGreaterThan(0);
      }
      const colon = ['chin', 'feather', 'mine', 'seem'].filter((cue) =>
        beat('duchess', cue, locale).some((line) => /[:：]\s*\S/u.test(line.text)),
      );
      expect(colon, locale).toEqual(['chin', 'feather', 'mine', 'seem']);
    });
  }
});
