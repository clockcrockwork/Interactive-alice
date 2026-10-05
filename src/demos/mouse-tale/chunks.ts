/**
 * The Mouse's tale set as a tail: each line of a verse in short groups of words,
 * the way the book sets it. A group is at most a few words and at most about as
 * wide as the book's own lines, measured in ems, so a script whose words are
 * wide (Japanese phrases, full-width glyphs) makes groups of fewer words. A
 * phrase may also break after a comma that has no space after it (the Japanese
 * 、), since the comma is a pause in any script. Nothing here knows any
 * language's words.
 */

import { emWidth, isWide } from '../shell/words.ts';

export { emWidth, isWide };

interface Token {
  text: string;
  /** What joins it to the next token: the space it had, or nothing after a comma. */
  glue: string;
}

const tokens = (text: string): Token[] =>
  text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((word) => {
      const parts = word.split(/(?<=[、，])/u).filter(Boolean);
      return parts.map((part, i) => ({ text: part, glue: i < parts.length - 1 ? '' : ' ' }));
    });

const joined = (group: readonly Token[]): string =>
  group
    .map((token) => token.text + token.glue)
    .join('')
    .trim();

/**
 * The words of a line in groups of at most `perChunk` words and `maxEms` ems.
 * The last group is never a single word when it can join the one before
 * without growing much past the measure.
 */
export function chunksOf(text: string, perChunk: number, maxEms: number): string[] {
  const groups: Token[][] = [];
  let current: Token[] = [];
  for (const token of tokens(text)) {
    const next = [...current, token];
    if (current.length > 0 && (next.length > perChunk || emWidth(joined(next)) > maxEms)) {
      groups.push(current);
      current = [token];
    } else {
      current = next;
    }
  }
  if (current.length > 0) {
    groups.push(current);
  }
  const last = groups.at(-1);
  const before = groups.at(-2);
  if (
    last &&
    before &&
    last.length === 1 &&
    emWidth(joined([...before, ...last])) <= maxEms * 1.25
  ) {
    groups.pop();
    groups[groups.length - 1] = [...before, ...last];
  }
  return groups.map(joined);
}
