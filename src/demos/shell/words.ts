/**
 * Reading the page's own sentences for what a demo draws from them: the words on
 * a bottle, the subjects written on the sand, the letter the sisters drew with,
 * a cry, the units a song lights one at a time. A sentence sets words apart the
 * way its script does: in quotation marks of any kind (「…」, “…”, «…», "…"), or,
 * in a script with capitals, by capitals. Nothing here knows any language's words,
 * only its punctuation and its case, and the page's locale profile
 * (docs/text-experience-binding.md, Language differences), so the same reading
 * works on every locale's page.
 */

/**
 * What a language IS, as far as reading and laying out its text goes: the locale
 * profile from `text/locales.json`, written onto the page's root as `data-*` by the
 * build. Code reads this, never the language's name.
 */
export interface LocaleProfile {
  /** The page's language, for `lang` attributes only; never branch on it. */
  lang: string;
  dir: 'ltr' | 'rtl';
  /** How the language marks a word on display, in order of preference. */
  setApart: readonly ('quotes' | 'capitals')[];
  /** How a line splits into the units a stage lights or lays out one at a time. */
  wordUnit: 'spaces' | 'segmenter';
  /** How speech is set apart where the script has no italic. */
  emphasis: 'italic' | 'slip';
  /** Whether the script's glyphs fill the em box. */
  glyphWidth: 'half' | 'full';
  /**
   * Whether the language's spaces are authored content: phrase spaces, the edges of
   * the units a young reader reads as one, rather than word spaces.
   */
  significantSpaces: boolean;
  /** The Intl tag numbers and word segmentation use. */
  tag: string;
}

const pick = <T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T => (allowed.includes(value as T) ? (value as T) : fallback);

/**
 * The page's profile, read from its root element. Every field has a neutral
 * default, so a page built without one still reads (quotes and capitals both,
 * spaces, italic, half-width): an optional fact never blanks a stage.
 */
export function pageProfile(root: HTMLElement = document.documentElement): LocaleProfile {
  const data = root.dataset;
  const setApart = (data.setApart ?? '')
    .split(' ')
    .filter(
      (method): method is 'quotes' | 'capitals' => method === 'quotes' || method === 'capitals',
    );
  return {
    lang: root.lang,
    dir: pick(root.dir, ['ltr', 'rtl'], 'ltr'),
    setApart: setApart.length > 0 ? setApart : ['quotes', 'capitals'],
    wordUnit: pick(data.wordUnit, ['spaces', 'segmenter'], 'spaces'),
    emphasis: pick(data.emphasis, ['italic', 'slip'], 'italic'),
    glyphWidth: pick(data.glyphWidth, ['half', 'full'], 'half'),
    significantSpaces: data.significantSpaces === 'true',
    tag: data.numbers || root.lang || 'und',
  };
}

/** A unit of a line, and what joined it to the next one in the source. */
export interface Unit {
  text: string;
  /** The whitespace that followed it, or nothing; `text + glue` of every unit is the line. */
  glue: string;
  /**
   * Whether the unit ends on a pause (a comma or a stop, of either width): a
   * stronger place to break after than a space, which a regrouping prefers.
   */
  pause: boolean;
}

/** A pause at a unit's end: a comma or a stop of either width, before any closing marks. */
const PAUSE = /[、，,;；:：。．.!！?？…‥][\p{Pe}\p{Pf}"'」』]*$/u;
const endsOnPause = (text: string): boolean => PAUSE.test(text);

type Segmenter = {
  segment(text: string): Iterable<{ segment: string; isWordLike?: boolean }>;
};
type SegmenterConstructor = new (
  locales: string | undefined,
  options: { granularity: 'word' | 'grapheme' },
) => Segmenter;

const segmenters = new Map<string, Segmenter | undefined>();

/**
 * `Intl.Segmenter` where the browser has it (Baseline 2024, so not yet inside the
 * project's browser target): one per tag and granularity, made once. An unknown tag
 * falls back to the default locale's rules rather than throwing.
 */
const segmenterFor = (
  tag: string | undefined,
  granularity: 'word' | 'grapheme',
): Segmenter | undefined => {
  const key = `${granularity}:${tag ?? ''}`;
  if (segmenters.has(key)) {
    return segmenters.get(key);
  }
  const Ctor = (Intl as unknown as { Segmenter?: SegmenterConstructor }).Segmenter;
  let made: Segmenter | undefined;
  if (Ctor) {
    try {
      made = new Ctor(tag, { granularity });
    } catch {
      made = new Ctor(undefined, { granularity });
    }
  }
  segmenters.set(key, made);
  return made;
};

/**
 * The user-perceived characters of a run: a letter with its accents, an emoji with
 * its modifiers, one each. Falls back to code points where `Intl.Segmenter` is not
 * available, which is right for every character this book's languages use.
 */
export function graphemes(text: string): string[] {
  const segmenter = segmenterFor(undefined, 'grapheme');
  return segmenter ? [...segmenter.segment(text)].map((part) => part.segment) : [...text];
}

/** A pause inside a phrase with no space after it: the full-width commas. */
const COMMA_SPLIT = /(?<=[、，])(?=\S)/u;

/** Spaces are the units' edges, and a full-width comma is a pause in any script. */
function spaceUnits(text: string): Unit[] {
  const units: Unit[] = [];
  for (const match of text.matchAll(/(\S+)(\s*)/gu)) {
    const parts = (match[1] ?? '').split(COMMA_SPLIT);
    parts.forEach((part, i) => {
      units.push({
        text: part,
        glue: i < parts.length - 1 ? '' : (match[2] ?? ''),
        pause: endsOnPause(part),
      });
    });
  }
  return units;
}

/**
 * Words found by `Intl.Segmenter`. Closing punctuation rides with the word before
 * it, an opening mark with the word after it, and whitespace is glue, so a quoted
 * word stays one unit and the units still join back into the line.
 */
function segmentedUnits(text: string, segmenter: Segmenter): Unit[] {
  const units: Unit[] = [];
  let lead = '';
  for (const { segment, isWordLike } of segmenter.segment(text)) {
    const last = units.at(-1);
    if (/^\s+$/u.test(segment)) {
      if (last && !lead) {
        last.glue += segment;
      } else {
        lead += segment;
      }
    } else if (isWordLike) {
      units.push({ text: lead + segment, glue: '', pause: false });
      lead = '';
    } else if (last?.glue !== '' || lead || /^[\p{Ps}\p{Pi}]/u.test(segment)) {
      lead += segment;
    } else {
      last.text += segment;
    }
  }
  if (lead) {
    units.push({ text: lead, glue: '', pause: false });
  }
  for (const unit of units) {
    unit.pause = endsOnPause(unit.text);
  }
  return units;
}

/**
 * Units joined across every place a quoted run would be cut: a run inside paired
 * quotation marks is one unit, whatever spaces or words it holds, so a name set
 * apart (a race's name, a word on a label) is never broken between two groups.
 */
function holdQuoted(line: string, parts: Unit[]): Unit[] {
  const spans = quotedSpans(line);
  if (spans.length === 0) {
    return parts;
  }
  const held: Unit[] = [];
  let at = 0;
  for (const part of parts) {
    const start = at;
    at += part.text.length + part.glue.length;
    const last = held.at(-1);
    // The boundary before this unit lies inside a quoted run: join it on.
    if (last && spans.some(([open, close]) => open < start && start <= close)) {
      last.text += last.glue + part.text;
      last.glue = part.glue;
      last.pause = endsOnPause(last.text);
    } else {
      held.push({ ...part });
    }
  }
  return held;
}

/**
 * A line as the units a stage lights or lays out one at a time, by the page's
 * profile: split at its spaces (and after a full-width comma) where the language
 * writes its units with spaces between them, by `Intl.Segmenter` words where it
 * does not. Joining every unit's `text + glue` gives the trimmed line back, so a
 * stage that wraps each unit keeps the line's own text. Where the browser has no
 * segmenter, a spaceless language falls back to its spaces: whole phrases, never
 * nothing.
 */
export function units(
  text: string,
  profile: Pick<LocaleProfile, 'wordUnit' | 'tag'> = { wordUnit: 'spaces', tag: 'und' },
): Unit[] {
  const line = text.trim();
  if (profile.wordUnit === 'segmenter') {
    const segmenter = segmenterFor(profile.tag, 'word');
    if (segmenter) {
      return holdQuoted(line, segmentedUnits(line, segmenter));
    }
  }
  return holdQuoted(line, spaceUnits(line));
}

/** Units joined back into a run of text, without the last unit's trailing glue. */
export const joinUnits = (group: readonly Unit[]): string =>
  group
    .map((unit) => unit.text + unit.glue)
    .join('')
    .trim();

/** Opening and closing quotation marks, paired by position. */
const OPEN = '「『“‘«‹„"';
const CLOSE = '」』”’»›“"';

/**
 * Where a sentence's quoted runs are, as `[open, close]` indices of their marks:
 * the outermost pairs only, each closed in the sentence. A mark that both opens
 * and closes (`"`, or “ inside „) closes when it is the one awaited; a closing mark
 * nobody opened (an apostrophe) is passed over.
 */
export function quotedSpans(text: string): [number, number][] {
  const spans: [number, number][] = [];
  const awaited: { close: string; at: number }[] = [];
  for (let i = 0; i < text.length; i += 1) {
    const char = text.charAt(i);
    if (awaited.length > 0 && char === awaited.at(-1)?.close) {
      const open = awaited.pop();
      if (open && awaited.length === 0) {
        spans.push([open.at, i]);
      }
      continue;
    }
    const which = OPEN.indexOf(char);
    if (which >= 0) {
      awaited.push({ close: CLOSE.charAt(which), at: i });
    }
  }
  return spans;
}

/** Every run of words a sentence puts inside quotation marks, in order. */
export function quoted(text: string): string[] {
  const found: string[] = [];
  let i = 0;
  while (i < text.length) {
    const which = OPEN.indexOf(text.charAt(i));
    if (which < 0) {
      i += 1;
      continue;
    }
    const end = text.indexOf(CLOSE.charAt(which), i + 1);
    if (end < 0) {
      i += 1;
      continue;
    }
    const inside = text.slice(i + 1, end).trim();
    if (inside) {
      found.push(inside);
    }
    i = end + 1;
  }
  return found;
}

type SetApartMethods = LocaleProfile['setApart'];
const BOTH: SetApartMethods = ['quotes', 'capitals'];

/**
 * Capitals that set words apart, in order: a run of all-capital words (DRINK ME),
 * or one capitalised word of `minLetters` or more (Reeling), so that in English the
 * pronouns and the short words that only open a sentence stay out.
 */
function capitalRuns(text: string, minLetters = 5): string[] {
  const capital = new RegExp(
    `(?<![\\p{L}\\p{N}])(?:\\p{Lu}{2,}(?:\\s+\\p{Lu}{2,})*|\\p{Lu}\\p{Ll}{${minLetters - 1},})(?![\\p{L}\\p{N}])`,
    'gu',
  );
  return [...text.matchAll(capital)].map((match) => match[0]);
}

/**
 * The words a sentence sets apart, or an empty string when it sets none apart:
 * by the methods the page's language declares, in its order of preference (both,
 * quotes first, where a caller does not say). An all-capital run wins over a
 * capitalised word, being the stronger mark.
 */
export function setApart(text: string, methods: SetApartMethods = BOTH): string {
  for (const method of methods) {
    if (method === 'quotes') {
      const first = quoted(text)[0];
      if (first) {
        return first;
      }
    } else {
      const runs = capitalRuns(text);
      const first = runs.find((run) => /^\p{Lu}{2}/u.test(run)) ?? runs[0];
      if (first) {
        return first;
      }
    }
  }
  return '';
}

/**
 * The names a sentence gives things, every one in order: what it quotes, or, when
 * it quotes nothing (or its language does not quote), its capitalised words.
 */
export function namedWords(
  text: string,
  minLetters = 5,
  methods: SetApartMethods = BOTH,
): string[] {
  for (const method of methods) {
    const found = method === 'quotes' ? quoted(text) : capitalRuns(text, minLetters);
    if (found.length > 0) {
      return found;
    }
  }
  return [];
}

/**
 * The letter some sentences name as a letter: one grapheme quoted on its own, or a
 * capital that stands alone as a word ("an M"). The one named most often.
 */
export function lonelyLetter(texts: readonly string[], methods: SetApartMethods = BOTH): string {
  const counts = new Map<string, number>();
  const count = (letter: string): void => {
    counts.set(letter, (counts.get(letter) ?? 0) + 1);
  };
  for (const text of texts) {
    if (methods.includes('quotes')) {
      for (const run of quoted(text)) {
        if (graphemes(run).length === 1) {
          count(run);
        }
      }
    }
    if (methods.includes('capitals')) {
      for (const match of text.matchAll(/(?<![\p{L}\p{N}])\p{Lu}(?![\p{L}\p{N}])/gu)) {
        count(match[0]);
      }
    }
  }
  let best = '';
  let most = 0;
  for (const [letter, n] of counts) {
    if (n > most) {
      best = letter;
      most = n;
    }
  }
  return best;
}

/**
 * What the gate counts as set apart (scripts/check-experience.py, `reads`), stated
 * here so a test can hold the two implementations to one rule. Stricter than the
 * readings above on purpose, so whatever passes the gate the stage finds: quotes
 * are any quoted run; capitals are an all-capital run, or a capitalised word of five
 * letters or more that does not open the sentence.
 */
export function gateRuns(text: string, methods: SetApartMethods): string[] {
  const runs: string[] = [];
  for (const method of methods) {
    if (method === 'quotes') {
      runs.push(...quoted(text));
      continue;
    }
    // The word that opens the sentence is capitalised for that reason alone.
    const opening = text.search(/[\p{L}\p{N}]/u);
    for (const match of text.matchAll(
      /(?<![\p{L}\p{N}])(?:\p{Lu}{2,}(?:\s+\p{Lu}{2,})*|\p{Lu}\p{Ll}{4,})(?![\p{L}\p{N}])/gu,
    )) {
      if (match.index !== opening || /^\p{Lu}{2}/u.test(match[0])) {
        runs.push(match[0]);
      }
    }
  }
  return runs;
}

/**
 * The letters the gate counts as named (`reads.letter`): a quoted run of exactly one
 * grapheme, or, where the language sets apart by capitals, a capital standing alone
 * just before punctuation or the end ("with an M.").
 */
export function gateLetters(text: string, methods: SetApartMethods): string[] {
  const found: string[] = [];
  for (const method of methods) {
    if (method === 'quotes') {
      found.push(...quoted(text).filter((run) => graphemes(run).length === 1));
    } else {
      for (const match of text.matchAll(/(?<![\p{L}\p{N}])\p{Lu}(?=\s*(?:\p{P}|$))/gu)) {
        found.push(match[0]);
      }
    }
  }
  return found;
}

/** Whether a sentence ends on an exclamation mark, of any width. */
export const exclaims = (text: string): boolean => /[!！‼]\s*$/u.test(text);

/** Wide (full-width) characters: CJK, kana, Hangul, and full-width forms. */
const WIDE =
  /[\u1100-\u115F\u2E80-\u303E\u3041-\u33FF\u3400-\u4DBF\u4E00-\u9FFF\uA960-\uA97F\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]/u;

/** Whether a run is set in full-width glyphs, which fill the em box and want more room. */
export const isWide = (text: string): boolean => WIDE.test(text);

/** Letters of the scripts known to be narrow; any other letter takes the page's glyph width. */
const NARROW_LETTER =
  /[\p{Script=Latin}\p{Script=Greek}\p{Script=Cyrillic}\p{Script=Hebrew}\p{Script=Arabic}]/u;

/**
 * A rough width in ems: a wide character is one, a narrow one a half. A letter of
 * a script this table does not know takes the page's glyph width
 * (`LocaleProfile.glyphWidth`), so a full-width script added later is not measured
 * as if it were Latin.
 */
export const emWidth = (text: string, glyphWidth: LocaleProfile['glyphWidth'] = 'half'): number =>
  graphemes(text).reduce((sum, char) => {
    if (WIDE.test(char)) {
      return sum + 1;
    }
    const unknown = glyphWidth === 'full' && /\p{L}/u.test(char) && !NARROW_LETTER.test(char);
    return sum + (unknown ? 1 : 0.5);
  }, 0);
