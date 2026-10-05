/** The wood's own props: a bare bough, a grin alone, a signpost, and the pictures
    the moon shows for a moment when the reader answers the Cat. */

import { CAT_GRIN_SVG } from '../art/vectors.ts';

export const BARE_BOUGH_SVG = `
<svg viewBox="0 0 400 240" focusable="false">
  <path d="M0 200 C80 180 140 190 220 176 C300 162 340 170 400 150" stroke="var(--cc-tree-mid, var(--ink-primary))" stroke-width="22" fill="none" stroke-linecap="round"/>
</svg>`;

/** The grin alone: the same grin the Cat wears, from the shared face. */
export const GRIN_SVG = CAT_GRIN_SVG;

/** A signpost; the arrow points right, and the sheet mirrors it for the left. */
export const SIGN_SVG = `
<svg viewBox="0 0 100 130" focusable="false">
  <rect x="46" y="40" width="8" height="90" fill="var(--cc-sign)"/>
  <g class="cc__sign-arrow">
    <path d="M10 22 L74 22 L92 38 L74 54 L10 54 Z" fill="var(--cc-sign)" stroke="var(--cc-grin)" stroke-width="3"/>
    <path d="M24 38 h44" stroke="var(--cc-grin)" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`;

/** Pig, or fig: what the moon shows for a moment, drawn into it like its own
    markings. Pictures only. A locale whose rhyme for pig is another thing draws
    that instead (the demo file's `pictures`): the lid is the Japanese one. */
export const MOON_PICTURES: Record<'pig' | 'fig' | 'lid', string> = {
  pig: `
<svg viewBox="0 0 100 100" focusable="false">
  <g fill="none" stroke="var(--sepia-dark)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M31 38 L22 15 L43 29 M69 38 L78 15 L57 29"/>
    <circle cx="50" cy="56" r="28"/>
    <ellipse cx="50" cy="66" rx="12" ry="8"/>
  </g>
  <circle cx="45.5" cy="66" r="2.4" fill="var(--sepia-dark)"/>
  <circle cx="54.5" cy="66" r="2.4" fill="var(--sepia-dark)"/>
  <circle cx="39" cy="49" r="3.2" fill="var(--sepia-dark)"/>
  <circle cx="61" cy="49" r="3.2" fill="var(--sepia-dark)"/>
</svg>`,
  fig: `
<svg viewBox="0 0 100 100" focusable="false">
  <path d="M50 24 C40 36 26 48 28 66 C30 82 42 88 50 88 C58 88 70 82 72 66 C74 48 60 36 50 24 Z" fill="oklch(from var(--sepia-mid) l c h / 0.45)" stroke="var(--sepia-dark)" stroke-width="4" stroke-linejoin="round"/>
  <path d="M50 24 V12" stroke="var(--sepia-dark)" stroke-width="4" stroke-linecap="round"/>
  <path d="M50 16 C58 6 72 8 77 14 C68 21 58 21 50 16 Z" fill="oklch(from var(--sepia-dark) l c h / 0.35)" stroke="var(--sepia-dark)" stroke-width="3" stroke-linejoin="round"/>
  <path d="M41 50 q-5 13 0 26" stroke="var(--sepia-mid)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
</svg>`,
  lid: `
<svg viewBox="0 0 100 100" focusable="false">
  <path d="M17 66 C19 44 34 34 50 34 C66 34 81 44 83 66 Z" fill="oklch(from var(--sepia-mid) l c h / 0.45)" stroke="var(--sepia-dark)" stroke-width="4" stroke-linejoin="round"/>
  <path d="M10 68 H90" stroke="var(--sepia-dark)" stroke-width="5" stroke-linecap="round"/>
  <path d="M42 34 V27 C42 20 58 20 58 27 V34" fill="oklch(from var(--sepia-dark) l c h / 0.35)" stroke="var(--sepia-dark)" stroke-width="4" stroke-linejoin="round"/>
  <path d="M30 54 q7 -10 17 -12" stroke="var(--sepia-mid)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
</svg>`,
};

const isMoonPicture = (name: string): name is keyof typeof MOON_PICTURES => name in MOON_PICTURES;

/** The moon's picture for an answer, after the page's locale has had its say. */
export const moonPicture = (name: string, fallback: 'pig' | 'fig'): keyof typeof MOON_PICTURES =>
  isMoonPicture(name) ? name : fallback;

/** The bough close up with the grin already on it: the last frame of Pig and
    Pepper and the first of the Cat's own demo, so the two join. `prefix` names
    the classes each demo styles. */
export const closeBough = (prefix: string): string =>
  `<div class="${prefix}"><div class="${prefix}-bare">${BARE_BOUGH_SVG}</div><div class="${prefix}-grin">${GRIN_SVG}</div></div>`;
