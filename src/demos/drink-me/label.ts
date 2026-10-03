/**
 * The words written on the bottle and on the cake are the words the story's own
 * sentence sets apart, read from the page at mount, never written in code. A
 * sentence sets words apart the way its script does: in quotation marks of any
 * kind (「…」, “…”, «…», "…"), or, in a script with capitals, in a run of capitals.
 * Nothing here knows any language's words, only its punctuation and its case.
 */

/** Opening and closing quotation marks, paired by position. */
const OPEN = '「『“‘«‹„"';
const CLOSE = '」』”’»›“"';

/** The words a sentence sets apart, or an empty string when it sets none apart. */
export function setApart(text: string): string {
  for (let i = 0; i < text.length; i += 1) {
    const which = OPEN.indexOf(text.charAt(i));
    if (which < 0) {
      continue;
    }
    const end = text.indexOf(CLOSE.charAt(which), i + 1);
    const inside = end > i ? text.slice(i + 1, end).trim() : '';
    if (inside) {
      return inside;
    }
  }
  const capitals = /\p{Lu}{2,}(?:\s+\p{Lu}{2,})*/u.exec(text);
  return capitals?.[0] ?? '';
}

/** The first words set apart in any of a beat's sentences. */
export function labelIn(lines: readonly { textContent: string | null }[]): string {
  for (const line of lines) {
    const found = setApart(line.textContent ?? '');
    if (found) {
      return found;
    }
  }
  return '';
}
