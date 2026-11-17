/**
 * The words written on the bottle and on the cake are the words the story's own
 * sentence sets apart, read from the page at mount, never written in code. How a
 * sentence sets words apart, in any script, is `shell/words.ts`.
 */

import { type LocaleProfile, setApart } from '../shell/words.ts';

export { setApart };

/**
 * The first words set apart in any of a beat's sentences, by the methods the page's
 * language declares (both, where the caller does not say).
 */
export function labelIn(
  lines: readonly { textContent: string | null }[],
  methods?: LocaleProfile['setApart'],
): string {
  for (const line of lines) {
    const found = setApart(line.textContent ?? '', methods);
    if (found) {
      return found;
    }
  }
  return '';
}
