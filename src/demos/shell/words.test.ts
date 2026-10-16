/**
 * What the demos read out of the page's sentences, in every locale, by
 * punctuation and case alone. The sentences come from the text layer and the
 * beats from each demo's composition, as at runtime.
 */

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { pythonCommand } from '../../../build/python.mjs';
import type { LocaleRegistry } from '../../types/schema.ts';
import {
  emWidth,
  exclaims,
  gateLetters,
  gateRuns,
  graphemes,
  joinUnits,
  type LocaleProfile,
  lonelyLetter,
  namedWords,
  pageProfile,
  quoted,
  quotedSpans,
  setApart,
  units,
} from './words.ts';

const root = join(import.meta.dirname, '..', '..', '..');
const locales = readdirSync(join(root, 'text', 'locales'));
const registry = JSON.parse(
  readFileSync(join(root, 'text', 'locales.json'), 'utf8'),
) as LocaleRegistry;
/** A locale's profile as the build writes it and the page reads it back. */
const profileOf = (locale: string): LocaleProfile => {
  const settings = registry.locales[locale];
  if (!settings) {
    throw new Error(`no locale ${locale}`);
  }
  return {
    lang: locale,
    dir: settings.dir,
    setApart: settings.setApart,
    wordUnit: settings.wordUnit,
    emphasis: settings.emphasis,
    glyphWidth: settings.glyphWidth,
    significantSpaces: settings.significantSpaces,
    tag: settings.numbers,
  };
};

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

describe('the locale profile, read from the page', () => {
  /** A root element as the build writes it, without a DOM. */
  const root = (lang: string, dir: string, data: Record<string, string>) =>
    ({ lang, dir, dataset: data }) as unknown as HTMLElement;

  it('reads every field the build writes, for every locale in the registry', () => {
    for (const locale of Object.keys(registry.locales)) {
      const expected = profileOf(locale);
      const read = pageProfile(
        root(locale, expected.dir, {
          setApart: expected.setApart.join(' '),
          wordUnit: expected.wordUnit,
          emphasis: expected.emphasis,
          glyphWidth: expected.glyphWidth,
          significantSpaces: String(expected.significantSpaces),
          numbers: expected.tag,
        }),
      );
      expect(read, locale).toEqual(expected);
    }
  });

  it('falls back to neutral defaults, never to nothing, on a page without a profile', () => {
    expect(pageProfile(root('xx', '', {}))).toEqual({
      lang: 'xx',
      dir: 'ltr',
      setApart: ['quotes', 'capitals'],
      wordUnit: 'spaces',
      emphasis: 'italic',
      glyphWidth: 'half',
      significantSpaces: false,
      tag: 'xx',
    });
    expect(pageProfile(root('', 'rtl', { wordUnit: 'nonsense' })).wordUnit).toBe('spaces');
  });
});

describe('a line in units, by the profile', () => {
  const spaced = { wordUnit: 'spaces', tag: 'und' } as const;

  it('splits at spaces, and after a full-width comma, keeping the line whole', () => {
    expect(units('Will you, won’t you  join?', spaced)).toEqual([
      { text: 'Will', glue: ' ', pause: false },
      { text: 'you,', glue: ' ', pause: true },
      { text: 'won’t', glue: ' ', pause: false },
      { text: 'you', glue: '  ', pause: false },
      { text: 'join?', glue: '', pause: true },
    ]);
    expect(units('ＡＡ、ＢＢ Ｃ', spaced).map((unit) => unit.text)).toEqual([
      'ＡＡ、',
      'ＢＢ',
      'Ｃ',
    ]);
    expect(units('', spaced)).toEqual([]);
  });

  it('marks a pause, of either width, as the stronger break after a unit', () => {
    const pauses = (line: string) =>
      units(line, spaced).map((unit) => (unit.pause ? `${unit.text}|` : unit.text));
    expect(pauses('ＡＡ、ＢＢ ＣＣ。')).toEqual(['ＡＡ、|', 'ＢＢ', 'ＣＣ。|']);
    expect(pauses('one, two; three: four.')).toEqual(['one,|', 'two;|', 'three:|', 'four.|']);
    // A closing mark after the pause still ends on it; an apostrophe is not a pause.
    expect(pauses('「ＡＡ。」 won’t')).toEqual(['「ＡＡ。」|', 'won’t']);
  });

  it('never breaks inside a quoted run, in any kind of quotation mark', () => {
    const texts = (line: string, profile = spaced as Parameters<typeof units>[1]) =>
      units(line, profile).map((unit) => unit.text);
    // The Caucus-race's name, quoted with a space inside, stays one unit.
    expect(texts('ＡＡ 「ＢＢ ＣＣ」ＥＥ ＤＤ')).toEqual(['ＡＡ', '「ＢＢ ＣＣ」ＥＥ', 'ＤＤ']);
    expect(texts('a “b, c d” e')).toEqual(['a', '“b, c d”', 'e']);
    // A comma inside the quote is no break either.
    expect(texts('「ＡＡ、ＢＢ」')).toEqual(['「ＡＡ、ＢＢ」']);
    // An unclosed mark holds nothing; an apostrophe opens nothing.
    expect(texts('「ＡＡ ＢＢ')).toEqual(['「ＡＡ', 'ＢＢ']);
    expect(texts('it’s a b')).toEqual(['it’s', 'a', 'b']);
    // Where units are words the segmenter finds, the quoted run is still one.
    const thai = units('พูดว่า “หมู ป่า” นะ', { wordUnit: 'segmenter', tag: 'th' });
    expect(thai.map((unit) => unit.text)).toContain('“หมู ป่า”');
    expect(joinUnits(thai)).toBe('พูดว่า “หมู ป่า” นะ');
  });

  it('finds the quoted runs of a sentence as spans of its marks', () => {
    expect(quotedSpans('ab 「cd」 e “f „g“ h”')).toEqual([
      [3, 6],
      [10, 18],
    ]);
    expect(quotedSpans('"a" b "c')).toEqual([[0, 2]]);
    expect(quotedSpans('no quotes’ here')).toEqual([]);
  });

  for (const locale of locales) {
    it(`gives back every ${locale} sentence of the songs and the tale, unit by unit`, () => {
      const profile = profileOf(locale);
      for (const [demo, cue] of [
        ['lobster-quadrille', 'verse-one'],
        ['mouse-tale', 'fury-one'],
      ] as const) {
        const lines = beat(demo, cue, locale);
        expect(lines.length, `${demo} ${cue}`).toBeGreaterThan(0);
        for (const line of lines) {
          const parts = units(line.text, profile);
          expect(joinUnits(parts), `${locale} ${line.id}`).toBe(line.text.trim());
          expect(parts.length, `${locale} ${line.id}`).toBeGreaterThan(1);
          for (const part of parts) {
            expect(part.text).not.toMatch(/\s/u);
          }
        }
      }
    });
  }

  it('finds words in a language written without spaces, by Intl.Segmenter', () => {
    // Thai: no spaces between words, one between phrases.
    const line = 'สวัสดีครับ อลิซ';
    const parts = units(line, { wordUnit: 'segmenter', tag: 'th' });
    expect(joinUnits(parts)).toBe(line);
    // More units than phrases: the segmenter found the words inside them.
    expect(parts.length).toBeGreaterThan(units(line, spaced).length);
    // Punctuation rides with its word, and a quoted word stays one unit.
    const quotedLine = 'พูดว่า “หมู”!';
    const marked = units(quotedLine, { wordUnit: 'segmenter', tag: 'th' });
    expect(joinUnits(marked)).toBe(quotedLine);
    expect(marked.at(-1)?.text).toBe('“หมู”!');
  });

  it('keeps a right-to-left line in its own logical order, unit by unit', () => {
    // Hebrew, as stored: logical order, which the browser lays out right to left.
    const line = 'אליס בארץ הפלאות.';
    const parts = units(line, { wordUnit: 'spaces', tag: 'he' });
    expect(parts.map((part) => part.text)).toEqual(line.split(' '));
    expect(joinUnits(parts)).toBe(line);
    const segmented = units(line, { wordUnit: 'segmenter', tag: 'he' });
    expect(joinUnits(segmented)).toBe(line);
    expect(segmented.map((part) => part.text)).toEqual(line.split(' '));
  });

  it('counts graphemes, so an accent or a joined emoji is one character', () => {
    expect(graphemes('éa')).toEqual(['é', 'a']);
    expect(graphemes('👩‍👧')).toHaveLength(1);
    expect(lonelyLetter(['x “é” y'])).toBe('é');
  });

  it('measures widths by glyph, and lets a full-width page widen a script it does not know', () => {
    expect(emWidth('ab')).toBe(1);
    expect(emWidth('ＡＢ')).toBe(2);
    // Yi syllables: not in the wide table, but a full-width page sets them full.
    expect(emWidth('ꀀꀁ')).toBe(1);
    expect(emWidth('ꀀꀁ', 'full')).toBe(2);
    // Latin stays narrow on a full-width page.
    expect(emWidth('ab', 'full')).toBe(1);
  });
});

describe('setting words apart by the methods a language declares', () => {
  it('reads only what the language declares, in its order', () => {
    expect(setApart('The DRINK ME and “x”.', ['quotes'])).toBe('x');
    expect(setApart('The DRINK ME and “x”.', ['capitals'])).toBe('DRINK ME');
    expect(setApart('The DRINK ME and “x”.', ['capitals', 'quotes'])).toBe('DRINK ME');
    expect(namedWords('We learned Reeling.', 5, ['quotes'])).toEqual([]);
    expect(lonelyLetter(['with an M, and 「a」'], ['quotes'])).toBe('a');
    expect(lonelyLetter(['with an M, and 「a」'], ['capitals'])).toBe('M');
  });

  it('keeps the gate stricter than the stage, so what passes the gate is found', () => {
    expect(gateRuns('Perhaps it has not one.', ['capitals'])).toEqual([]);
    expect(gateRuns('Then Drawling.', ['capitals'])).toEqual(['Drawling']);
    expect(gateLetters('I said pig.', ['capitals'])).toEqual([]);
    expect(gateLetters('Everything with an M.', ['capitals'])).toEqual(['M']);
    for (const text of ['Then Drawling.', 'x 「ab」', 'The DRINK ME.', 'with an M?', 'x «y»']) {
      const both = ['quotes', 'capitals'] as const;
      if (gateRuns(text, both).length > 0) {
        expect(namedWords(text, 5, both).length, text).toBeGreaterThan(0);
        expect(setApart(text, both), text).not.toBe('');
      }
      if (gateLetters(text, both).length > 0) {
        expect(lonelyLetter([text], both), text).not.toBe('');
      }
    }
  });

  it('agrees with the gate in scripts/check-experience.py, sentence for sentence', () => {
    const samples: [string, ('quotes' | 'capitals')[]][] = [
      ['The label said DRINK ME in big letters.', ['quotes', 'capitals']],
      ['Ambition, Distraction, Uglification, and Derision.', ['capitals']],
      ['Perhaps it has not one.', ['quotes', 'capitals']],
      ['Everything that begins with an M.', ['quotes', 'capitals']],
      ['I said pig.', ['capitals']],
      ['x 「ab」 y «cd»', ['quotes']],
      ['x 「é」', ['quotes']],
      ['x 「ab」', ['capitals']],
    ];
    for (const locale of locales) {
      const profile = profileOf(locale);
      for (const cue of ['reeling', 'more', 'drawling', 'grief', 'uglify']) {
        for (const line of beat('mock-turtle', cue, locale)) {
          samples.push([line.text, [...profile.setApart]]);
        }
      }
      for (const line of beat('dormouse', 'doze', locale)) {
        samples.push([line.text, [...profile.setApart]]);
      }
    }
    const [python, ...args] = pythonCommand();
    if (!python) {
      throw new Error('no Python interpreter');
    }
    const reference = JSON.parse(
      execFileSync(
        python,
        [
          ...args,
          '-c',
          [
            'import importlib.util, json, sys',
            'spec = importlib.util.spec_from_file_location("gate", sys.argv[1])',
            'gate = importlib.util.module_from_spec(spec)',
            'spec.loader.exec_module(gate)',
            'samples = json.loads(sys.stdin.read())',
            'print(json.dumps([[bool(gate.gate_runs(t, m)), gate.gate_letters(t, m)] for t, m in samples]))',
          ].join('\n'),
          join(root, 'scripts', 'check-experience.py'),
        ],
        { encoding: 'utf8', input: JSON.stringify(samples) },
      ),
    ) as [boolean, string[]][];
    expect(reference).toEqual(
      samples.map(([text, methods]) => [
        gateRuns(text, methods).length > 0,
        gateLetters(text, methods),
      ]),
    );
  });
});
