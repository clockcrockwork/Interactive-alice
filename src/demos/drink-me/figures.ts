/** The key, the bottle and the cake. Their labels are filled in from the text
 * (label.ts reads them from the sentences that set them apart). */

import { type ArtStyle, artStyle } from '../art/treatments.ts';
import { emWidth, type LocaleProfile, units } from '../shell/words.ts';

const ANTIQUE_KEY = new URL(
  '../../assets/images/figures/antique-key.any.generated.webp',
  import.meta.url,
).href;

/** What a label's layout needs to know about its language: the page's profile. */
export type LabelLayout = Pick<LocaleProfile, 'wordUnit' | 'tag' | 'glyphWidth'>;
const SPACED: LabelLayout = { wordUnit: 'spaces', tag: 'und', glyphWidth: 'half' };

/** A label's words as SVG text: escaped, since they come from the page's own text. */
const words = (label: string): string =>
  label.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/**
 * Words of full-width glyphs that would be squeezed thin on one line are set on
 * two instead, broken between the units nearest the middle (`units()`: at a space,
 * or between words where the language writes none; after a pause by preference,
 * and never inside a quoted run), at a size that fits. A label
 * narrow enough for one line (any capitals) is left to the caller.
 */
function twoLines(label: string, layout: LabelLayout): [string, string] | undefined {
  if (emWidth(label, layout.glyphWidth) <= 5) {
    return undefined;
  }
  const parts = units(label, layout);
  if (parts.length < 2) {
    return undefined;
  }
  // Where each unit ends in the label, the last one excepted, and whether it ends
  // on a pause: a comma or a stop is the stronger break, so it wins over a space
  // unless it lies a quarter of the label further from the middle.
  let end = 0;
  const breaks = parts.slice(0, -1).map((part) => {
    end += part.text.length + part.glue.length;
    return { index: end, pause: part.pause };
  });
  const middle = label.length / 2;
  const cost = (at: { index: number; pause: boolean }): number =>
    Math.abs(at.index - middle) - (at.pause ? label.length / 4 : 0);
  const at = breaks.reduce((best, candidate) => (cost(candidate) < cost(best) ? candidate : best));
  return [label.slice(0, at.index).trim(), label.slice(at.index).trim()];
}

/** The label's `<text>`: one line fitted to `fit` units, or two lines when it reads better. */
export const labelText = (
  label: string,
  x: number,
  y: number,
  size: number,
  fit: number,
  layout: LabelLayout = SPACED,
): string => {
  const lines = twoLines(label, layout);
  if (!lines) {
    return `<text class="dk__label-text" x="${x}" y="${y}" font-size="${size}" text-anchor="middle" textLength="${fit}" lengthAdjust="spacingAndGlyphs">${words(label)}</text>`;
  }
  // A little under the size that fills the measure, the pair centred where the
  // single line's middle would be.
  const small =
    Math.min(size, fit / Math.max(...lines.map((line) => emWidth(line, layout.glyphWidth)))) * 0.9;
  const lead = small * 1.1;
  const first = y - size * 0.4 - lead / 2 + small * 0.35;
  return `<text class="dk__label-text" x="${x}" y="${first.toFixed(2)}" font-size="${small.toFixed(2)}" text-anchor="middle"><tspan x="${x}">${words(lines[0])}</tspan><tspan x="${x}" dy="${lead.toFixed(2)}">${words(lines[1])}</tspan></text>`;
};

/** One side of the paper label round the bottle's neck: the words and nothing else,
 * stretched to fit whatever their length in whatever language. */
export const labelFaceSvg = (label: string, layout: LabelLayout = SPACED): string => `
<svg viewBox="0 0 48 26" focusable="false">
  <path class="dk__label-paper" d="M2 2 Q24 5 46 2 C43 9 43 17 46 24 Q24 21 2 24 C5 17 5 9 2 2 Z" fill="var(--dk-label)" stroke="var(--sepia-dark)" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M3 3 C6 9 6 17 3 23 Q7 24 10 23 C12 17 12 9 10 3 Q6 4 3 3Z M45 3 C42 9 42 17 45 23 Q41 24 38 23 C36 17 36 9 38 3 Q42 4 45 3Z" fill="var(--sepia-dark)" opacity="0.13"/>
  ${labelText(label, 24, 17.5, 11, 38, layout)}
</svg>`;

export const KEY_SVG = `
<svg viewBox="0 0 60 24" focusable="false">
  <circle cx="11" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="4"/>
  <path d="M20 12 H56 M48 12 v8 M40 12 v6" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
</svg>`;

/** Keep the key on its original 60×24 movement pivot and fall back to its drawing. */
export function keyMarkup(
  style: ArtStyle = typeof document === 'undefined' ? 'flat' : artStyle(),
): string {
  if (style !== 'engraved') return KEY_SVG;
  const fallback = KEY_SVG.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return `<svg viewBox="0 0 60 24" focusable="false" data-generated-rig="drink-me/key"><g data-rig-fallback="">${fallback}</g><g data-rig-generated="" visibility="hidden" display="none"><image data-rig-image="" href="${ANTIQUE_KEY}" width="60" height="24" preserveAspectRatio="xMidYMid meet"/></g></svg>`;
}

export const bottleSvg = (label: string, layout: LabelLayout = SPACED): string => `
<svg viewBox="0 0 60 140" focusable="false">
  <rect x="22" y="2" width="16" height="14" rx="3" fill="var(--sepia-dark)"/>
  <path d="M20 16 h20 v22 q14 8 14 30 v60 q0 10 -10 10 h-28 q-10 0 -10 -10 v-60 q0 -22 14 -30 z" fill="var(--dk-glass)" stroke="var(--dk-glass-edge)" stroke-width="2"/>
  <g class="dk__liquid">
    <path d="M9 70 h42 v58 q0 8 -8 8 h-26 q-8 0 -8 -8 z" fill="var(--dk-drink)"/>
  </g>
  <path class="dk__label-paper" d="M6 53 Q30 57 54 53 C50 60 50 70 54 77 Q30 73 6 77 C10 70 10 60 6 53 Z" fill="var(--dk-label)" stroke="var(--sepia-dark)" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="M7 54 C11 60 11 70 7 76 Q11 77 15 76 C18 70 18 60 15 54 Q11 55 7 54Z M53 54 C49 60 49 70 53 76 Q49 77 45 76 C42 70 42 60 45 54 Q49 55 53 54Z" fill="var(--sepia-dark)" opacity="0.13"/>
  <path d="M30 40 v12" stroke="var(--sepia-dark)" stroke-width="1.5"/>
  ${labelText(label, 30, 70, 11, 40, layout)}
</svg>`;

/** The bottle in her hand, without its label: the label is a ring of paper the
 * demo turns round it (`.dk__label-ring`), tied on at the neck. */
export const BOTTLE_GLASS_SVG = `
<svg viewBox="0 0 60 140" focusable="false">
  <rect x="22" y="2" width="16" height="14" rx="3" fill="var(--sepia-dark)"/>
  <path d="M20 16 h20 v22 q14 8 14 30 v60 q0 10 -10 10 h-28 q-10 0 -10 -10 v-60 q0 -22 14 -30 z" fill="var(--dk-glass)" stroke="var(--dk-glass-edge)" stroke-width="2"/>
  <g class="dk__liquid">
    <path d="M9 70 h42 v58 q0 8 -8 8 h-26 q-8 0 -8 -8 z" fill="var(--dk-drink)"/>
  </g>
  <path d="M14 84 q2 30 4 44" stroke="var(--dk-glass-edge)" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M21 40 q9 5 18 0" stroke="var(--sepia-dark)" stroke-width="1.5" fill="none"/>
</svg>`;

export const cakeSvg = (label: string): string => `
<svg viewBox="0 0 120 80" focusable="false">
  <rect x="4" y="10" width="112" height="66" rx="6" fill="var(--dk-glass)" stroke="var(--dk-glass-edge)" stroke-width="2"/>
  <ellipse cx="60" cy="58" rx="42" ry="12" fill="var(--dk-cake-crust)"/>
  <path d="M18 58 v-16 q0 -6 6 -6 h72 q6 0 6 6 v16 q-42 14 -84 0 z" fill="var(--dk-cake)"/>
  <ellipse cx="60" cy="36" rx="42" ry="10" fill="var(--paper-base)"/>
  <text class="dk__label-text" x="60" y="40" font-size="10" text-anchor="middle" fill="var(--dk-currant)" letter-spacing="1">${words(label)}</text>
  <g class="dk__bite">
    <circle cx="94" cy="44" r="14" fill="var(--dk-glass)"/>
    <circle cx="94" cy="44" r="12" fill="var(--dk-glass-edge)"/>
  </g>
</svg>`;
