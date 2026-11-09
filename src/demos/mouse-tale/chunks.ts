/**
 * The Mouse's tale set as a tail: each line of a verse in short groups of units,
 * the way the book sets it. A unit is what the page's language splits a line into
 * (`units()` in shell/words.ts: its spaces, a full-width comma, or the words
 * `Intl.Segmenter` finds where the language writes no spaces; a quoted run is
 * always one). A group is at most a few units and at most about as wide as the
 * book's own lines, measured in ems, so a script whose units are wide (Japanese
 * phrases, full-width glyphs) makes groups of fewer of them. Where the language's
 * spaces are phrase spaces (`significantSpaces`), a pause is the stronger break:
 * a group ends at a comma or a stop rather than running on past it, so a verse
 * written in phrases between commas (seven and five) keeps them. Where its spaces
 * are word spaces, the groups are the book's, counted in words. Nothing here
 * knows any language's words.
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
export type ChunkProfile = Pick<
  LocaleProfile,
  'wordUnit' | 'tag' | 'glyphWidth' | 'significantSpaces'
>;
const SPACED: ChunkProfile = {
  wordUnit: 'spaces',
  tag: 'und',
  glyphWidth: 'half',
  significantSpaces: false,
};

/**
 * The units of a line in groups of at most `perChunk` units and `maxEms` ems.
 * Where spaces are word spaces the groups fill in reading order, and the last
 * group is never a single unit when it can join the one before without growing
 * much past the measure. Where spaces are phrase spaces, the line is first parted
 * at its pauses, and each part is set in as few groups as fit, as evenly as they
 * can be.
 */
export function chunksOf(
  text: string,
  perChunk: number,
  maxEms: number,
  profile: ChunkProfile = SPACED,
): string[] {
  const width = (group: readonly Unit[]): number => emWidth(joinUnits(group), profile.glyphWidth);
  const fits = (group: readonly Unit[]): boolean =>
    group.length === 1 || (group.length <= perChunk && width(group) <= maxEms);
  const all = units(text, profile);
  if (profile.significantSpaces) {
    const parts: Unit[][] = [[]];
    for (const unit of all) {
      parts.at(-1)?.push(unit);
      if (unit.pause) {
        parts.push([]);
      }
    }
    return parts
      .filter((part) => part.length > 0)
      .flatMap((part) => evenly(part, fits, width))
      .map(joinUnits);
  }
  const groups: Unit[][] = [];
  let current: Unit[] = [];
  for (const unit of all) {
    const next = [...current, unit];
    if (current.length > 0 && !fits(next)) {
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

/**
 * A run of units in the fewest groups that each fit, and of those the split whose
 * widest group is narrowest: seven and five rather than ten and two.
 */
function evenly(
  run: readonly Unit[],
  fits: (group: readonly Unit[]) => boolean,
  width: (group: readonly Unit[]) => number,
): Unit[][] {
  const best = (from: number, count: number): { groups: Unit[][]; widest: number } | undefined => {
    if (count === 1) {
      const group = run.slice(from);
      return fits(group) ? { groups: [group], widest: width(group) } : undefined;
    }
    let found: { groups: Unit[][]; widest: number } | undefined;
    for (let end = from + 1; end <= run.length - count + 1; end += 1) {
      const group = run.slice(from, end);
      if (!fits(group)) {
        break;
      }
      const rest = best(end, count - 1);
      if (rest) {
        const widest = Math.max(width(group), rest.widest);
        if (!found || widest < found.widest) {
          found = { groups: [group, ...rest.groups], widest };
        }
      }
    }
    return found;
  };
  for (let count = 1; count <= run.length; count += 1) {
    const split = best(0, count);
    if (split) {
      return split.groups;
    }
  }
  return run.map((unit) => [unit]);
}

/** One of the tail's finest groups, and the line of the verse it belongs to. */
export interface TailPiece {
  text: string;
  line: number;
}

/** How the tail is set: the book's sizes, shrinking down it, and its row pitch. */
export interface TailMeasure {
  /** The first row's size and the size rows stop shrinking at, in px. */
  base: number;
  floor: number;
  /** Each row is this much the size of the one before. */
  shrink: number;
  /** Distance down the tail before the first row, in px. */
  lead: number;
  /** Rows stand this many of their own sizes apart (wider where the glyphs are full-width). */
  pitch: (text: string) => number;
  glyphWidth: LocaleProfile['glyphWidth'];
  /** The longest a joined row may be, in ems, and how many groups it may join. */
  rowEms: number;
  rowPieces: number;
  /** The smallest the tail's type may be scaled to before it is reported as not fitting. */
  minScale: number;
}

/** The tail as rows: which pieces stand side by side on each, at what scale. */
export interface TailLayout {
  /** Piece indices per row, in reading order. */
  rows: number[][];
  /** 0: one group per row; 1: neighbouring groups of a line joined into longer rows. */
  level: 0 | 1;
  scale: number;
  /** The tail's height from its first row's lead to past its last row, in px. */
  height: number;
  /** Each row's distance down the tail and its size, in px. */
  at: { s: number; size: number }[];
  fits: boolean;
}

/**
 * Rows of one group each; or a line's groups joined in pairs counted from the
 * line's start (the first with the second, the third with the fourth), so a verse
 * written seven-and-five keeps each couplet on one row. A pair too wide for a row
 * stays two rows. Groups of two lines never share a row.
 */
function rowsOf(pieces: readonly TailPiece[], level: 0 | 1, m: TailMeasure): number[][] {
  if (level === 0) {
    return pieces.map((_, i) => [i]);
  }
  const rows: number[][] = [];
  let i = 0;
  while (i < pieces.length) {
    const lineStart = i;
    const line = pieces[i]?.line;
    while (i < pieces.length && pieces[i]?.line === line) {
      i += 1;
    }
    for (let k = lineStart; k < i; k += m.rowPieces) {
      const group = Array.from({ length: Math.min(m.rowPieces, i - k) }, (_, j) => k + j);
      const joined = group.map((g) => pieces[g]?.text ?? '').join(' ');
      if (group.length > 1 && emWidth(joined, m.glyphWidth) > m.rowEms) {
        rows.push(...group.map((g) => [g]));
      } else {
        rows.push(group);
      }
    }
  }
  return rows;
}

/** Where each row falls down the tail at a scale, and the tail's whole height. */
function stack(
  pieces: readonly TailPiece[],
  rows: number[][],
  scale: number,
  m: TailMeasure,
): { at: { s: number; size: number }[]; height: number } {
  let s = m.lead;
  const at = rows.map((row, i) => {
    const size = Math.max(m.floor, m.base * m.shrink ** i) * scale;
    const pitch = Math.max(...row.map((k) => m.pitch(pieces[k]?.text ?? '')));
    s += size * pitch * 0.5;
    const here = { s, size };
    s += size * pitch * 0.5;
    return here;
  });
  const last = at.at(-1);
  return { at, height: (last?.s ?? 0) + (last?.size ?? 0) * 2 };
}

/**
 * The tail set to fit the room below where it starts, the shell's caption fit
 * applied to the tail: the finest groups at the book's sizes where they fit; else
 * neighbouring groups of a line joined into fewer, longer rows; else those rows
 * set smaller, down to `minScale`. What still does not fit is said (`fits`), so the
 * stage can report it rather than let the tail run out of the frame.
 */
export function layTail(pieces: readonly TailPiece[], room: number, m: TailMeasure): TailLayout {
  const plan = (level: 0 | 1, scale: number): TailLayout => {
    const rows = rowsOf(pieces, level, m);
    const { at, height } = stack(pieces, rows, scale, m);
    return { rows, level, scale, height, at, fits: height <= room };
  };
  const finest = plan(0, 1);
  if (finest.fits) {
    return finest;
  }
  for (let scale = 1; scale >= m.minScale - 1e-9; scale -= 0.05) {
    const joined = plan(1, Math.round(scale * 100) / 100);
    if (joined.fits) {
      return joined;
    }
  }
  return plan(1, m.minScale);
}
