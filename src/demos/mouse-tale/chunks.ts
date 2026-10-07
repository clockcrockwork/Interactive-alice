/**
 * The Mouse's tale set as a tail: each line of a verse in short groups of units,
 * the way the book sets it. A unit is what the page's language splits a line into
 * (`units()` in shell/words.ts: its spaces, a full-width comma, or the words
 * `Intl.Segmenter` finds where the language writes no spaces). A group is at most a
 * few units and at most about as wide as the book's own lines, measured in ems, so
 * a script whose units are wide (Japanese phrases, full-width glyphs) makes groups
 * of fewer of them. Nothing here knows any language's words.
 */

import {
  emWidth,
  isWide,
  joinUnits,
  type LocaleProfile,
  type Unit,
  units,
} from '../shell/words.ts';

export { emWidth, isWide };

/** What grouping needs to know about the page's language: its profile. */
export type ChunkProfile = Pick<LocaleProfile, 'wordUnit' | 'tag' | 'glyphWidth'>;
const SPACED: ChunkProfile = { wordUnit: 'spaces', tag: 'und', glyphWidth: 'half' };

/**
 * The units of a line in groups of at most `perChunk` units and `maxEms` ems.
 * The last group is never a single unit when it can join the one before
 * without growing much past the measure.
 */
export function chunksOf(
  text: string,
  perChunk: number,
  maxEms: number,
  profile: ChunkProfile = SPACED,
): string[] {
  const width = (group: readonly Unit[]): number => emWidth(joinUnits(group), profile.glyphWidth);
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
