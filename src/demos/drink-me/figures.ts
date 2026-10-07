/** The key, the bottle and the cake. Their labels are filled in from the text
 * (label.ts reads them from the sentences that set them apart). */

import { emWidth, type LocaleProfile, units } from '../shell/words.ts';

/** What a label's layout needs to know about its language: the page's profile. */
export type LabelLayout = Pick<LocaleProfile, 'wordUnit' | 'tag' | 'glyphWidth'>;
const SPACED: LabelLayout = { wordUnit: 'spaces', tag: 'und', glyphWidth: 'half' };

/** A label's words as SVG text: escaped, since they come from the page's own text. */
const words = (label: string): string =>
  label.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/**
 * Words of full-width glyphs that would be squeezed thin on one line are set on
 * two instead, broken between the units nearest the middle (`units()`: at a space,
 * or between words where the language writes none), at a size that fits. A label
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
  // Where each unit ends in the label, the last one excepted.
  let end = 0;
  const breaks = parts.slice(0, -1).map((part) => {
    end += part.text.length + part.glue.length;
    return end;
  });
  const middle = label.length / 2;
  const at = breaks.reduce((best, index) =>
    Math.abs(index - middle) < Math.abs(best - middle) ? index : best,
  );
  return [label.slice(0, at).trim(), label.slice(at).trim()];
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
  <rect x="1" y="1" width="46" height="24" rx="3" fill="var(--dk-label)" stroke="var(--sepia-dark)"/>
  ${labelText(label, 24, 17.5, 11, 38, layout)}
</svg>`;

export const KEY_SVG = `
<svg viewBox="0 0 60 24" focusable="false">
  <circle cx="11" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="4"/>
  <path d="M20 12 H56 M48 12 v8 M40 12 v6" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
</svg>`;

export const bottleSvg = (label: string, layout: LabelLayout = SPACED): string => `
<svg viewBox="0 0 60 140" focusable="false">
  <rect x="22" y="2" width="16" height="14" rx="3" fill="var(--sepia-dark)"/>
  <path d="M20 16 h20 v22 q14 8 14 30 v60 q0 10 -10 10 h-28 q-10 0 -10 -10 v-60 q0 -22 14 -30 z" fill="var(--dk-glass)" stroke="var(--dk-glass-edge)" stroke-width="2"/>
  <g class="dk__liquid">
    <path d="M9 70 h42 v58 q0 8 -8 8 h-26 q-8 0 -8 -8 z" fill="var(--dk-drink)"/>
  </g>
  <rect x="6" y="52" width="48" height="26" rx="3" fill="var(--dk-label)" stroke="var(--sepia-dark)"/>
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
