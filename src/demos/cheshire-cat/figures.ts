/** The wood's own props: a bare bough, a grin alone, and a signpost. */

import { CAT_GRIN_SVG } from '../art/vectors.ts';

export const BARE_BOUGH_SVG = `
<svg viewBox="0 0 400 240" focusable="false">
  <path d="M0 200 C80 180 140 190 220 176 C300 162 340 170 400 150" stroke="var(--cc-tree-mid, var(--ink-primary))" stroke-width="22" fill="none" stroke-linecap="round"/>
</svg>`;

/** The grin alone: the same grin the Cat wears, from the shared face. */
export const GRIN_SVG = CAT_GRIN_SVG;

export const signSvg = (direction: 'left' | 'right'): string => `
<svg viewBox="0 0 100 130" focusable="false">
  <rect x="46" y="40" width="8" height="90" fill="var(--cc-sign)"/>
  <g class="cc__sign-arrow" transform="${direction === 'left' ? 'scale(-1 1) translate(-100 0)' : ''}">
    <path d="M10 22 L74 22 L92 38 L74 54 L10 54 Z" fill="var(--cc-sign)" stroke="var(--cc-grin)" stroke-width="3"/>
    <path d="M24 38 h44" stroke="var(--cc-grin)" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`;

/** The bough close up with the grin already on it: the last frame of Pig and
    Pepper and the first of the Cat's own demo, so the two join. `prefix` names
    the classes each demo styles. */
export const closeBough = (prefix: string): string =>
  `<div class="${prefix}"><div class="${prefix}-bare">${BARE_BOUGH_SVG}</div><div class="${prefix}-grin">${GRIN_SVG}</div></div>`;
