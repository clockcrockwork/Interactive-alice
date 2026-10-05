/**
 * Reading the page's own sentences for what a demo draws from them: the words on
 * a bottle, the subjects written on the sand, the letter the sisters drew with,
 * a cry. A sentence sets words apart the way its script does: in quotation marks
 * of any kind (「…」, “…”, «…», "…"), or, in a script with capitals, by capitals.
 * Nothing here knows any language's words, only its punctuation and its case, so
 * the same reading works on every locale's page.
 */

/** Opening and closing quotation marks, paired by position. */
const OPEN = '「『“‘«‹„"';
const CLOSE = '」』”’»›“"';

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

/** The words a sentence sets apart, or an empty string when it sets none apart. */
export function setApart(text: string): string {
  const first = quoted(text)[0];
  if (first) {
    return first;
  }
  const capitals = /\p{Lu}{2,}(?:\s+\p{Lu}{2,})*/u.exec(text);
  return capitals?.[0] ?? '';
}

/**
 * The names a sentence gives things: what it quotes, or, when it quotes nothing,
 * its capitalised words of `minLetters` or more, so that in English the pronouns
 * and the words that only open a sentence stay out.
 */
export function namedWords(text: string, minLetters = 5): string[] {
  const inQuotes = quoted(text);
  if (inQuotes.length > 0) {
    return inQuotes;
  }
  const capital = new RegExp(
    `(?<![\\p{L}\\p{N}])\\p{Lu}\\p{Ll}{${minLetters - 1},}(?![\\p{L}\\p{N}])`,
    'gu',
  );
  return [...text.matchAll(capital)].map((match) => match[0]);
}

/**
 * The letter some sentences name as a letter: one character quoted on its own,
 * or a capital that stands alone as a word ("an M"). The one named most often.
 */
export function lonelyLetter(texts: readonly string[]): string {
  const counts = new Map<string, number>();
  const count = (letter: string): void => {
    counts.set(letter, (counts.get(letter) ?? 0) + 1);
  };
  for (const text of texts) {
    for (const run of quoted(text)) {
      if ([...run].length === 1) {
        count(run);
      }
    }
    for (const match of text.matchAll(/(?<![\p{L}\p{N}])\p{Lu}(?![\p{L}\p{N}])/gu)) {
      count(match[0]);
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

/** Whether a sentence ends on an exclamation mark, of any width. */
export const exclaims = (text: string): boolean => /[!！‼]\s*$/u.test(text);

/** Wide (full-width) characters: CJK, kana, Hangul, and full-width forms. */
const WIDE =
  /[\u1100-\u115F\u2E80-\u303E\u3041-\u33FF\u3400-\u4DBF\u4E00-\u9FFF\uA960-\uA97F\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]/u;

/** Whether a run is set in full-width glyphs, which fill the em box and want more room. */
export const isWide = (text: string): boolean => WIDE.test(text);

/** A rough width in ems: a wide character is one, anything else a half. */
export const emWidth = (text: string): number =>
  [...text].reduce((sum, char) => sum + (WIDE.test(char) ? 1 : 0.5), 0);
