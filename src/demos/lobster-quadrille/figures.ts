/** The Lobster Quadrille's props: her own hands with a lobster, the jelly-fish, the tureen, and the court doors. */

import { figure } from '../art/art.ts';

export const HANDS_WITH_LOBSTER = `
<div class="lq__hand lq__hand--left">${figure('alice/hand-left')}</div>
<div class="lq__lobster-held">${figure('lobster')}</div>
<div class="lq__hand lq__hand--right">${figure('alice/hand-right')}</div>`;

/** A jelly-fish on the shingle between the two lines, to be cleared out of the way. */
export const JELLY_SVG = `
<svg viewBox="0 0 80 80" focusable="false">
  <path d="M8 40 Q8 8 40 8 Q72 8 72 40 Q56 46 40 42 Q24 46 8 40 Z" fill="color-mix(in oklch, var(--world-water) 45%, var(--paper-base))" opacity="0.85"/>
  <path d="M14 36 Q40 30 66 36" stroke="var(--lq-foam)" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M20 44 q-6 14 2 30 M34 46 q6 14 -2 30 M48 46 q-6 14 2 30 M62 44 q6 14 -2 28" stroke="color-mix(in oklch, var(--world-water) 60%, var(--paper-base))" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="32" cy="26" r="2.5" fill="var(--ink-primary)"/><circle cx="48" cy="26" r="2.5" fill="var(--ink-primary)"/>
</svg>`;

export const TUREEN_SVG = `
<svg viewBox="0 0 200 140" focusable="false">
  <ellipse cx="100" cy="120" rx="70" ry="12" fill="oklch(from var(--ink-primary) l c h / 0.2)"/>
  <path d="M30 60 Q30 120 100 120 Q170 120 170 60 Z" fill="var(--paper-base)"/>
  <ellipse cx="100" cy="60" rx="70" ry="14" fill="var(--world-leaf-deep)"/>
  <ellipse cx="100" cy="58" rx="60" ry="9" fill="var(--world-leaf)"/>
  <path d="M20 66 q-16 0 -10 16 M180 66 q16 0 10 16" stroke="var(--paper-aged)" stroke-width="8" fill="none" stroke-linecap="round"/>
  <g class="lq__steam">
    <path d="M70 46 q-10 -16 0 -30 M100 42 q-10 -18 0 -34 M130 46 q-10 -16 0 -30" stroke="var(--lq-foam)" stroke-width="5" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;

/** The court's doors at the end of the shore: a path, a frame with the court's
    light in it, and two leaves. The trial opens on the same pair from inside. */
export const COURT_DOORS = `
<div class="lq__court-path"></div>
<div class="lq__court-doors">
  <div class="lq__court-light"></div>
  <div class="lq__court-leaf lq__court-leaf--left"></div>
  <div class="lq__court-leaf lq__court-leaf--right"></div>
</div>`;
