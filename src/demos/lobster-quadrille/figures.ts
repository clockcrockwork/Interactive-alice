/** The Lobster Quadrille's props: her own hands with a lobster, the tureen, and the court doors. */

import { figure } from '../art/art.ts';

export const HANDS_WITH_LOBSTER = `
<div class="lq__hand lq__hand--left"><svg viewBox="0 0 120 160" focusable="false"><path d="M20 160 L20 80 Q30 40 60 46 Q90 40 100 80 L100 160 Z" fill="var(--alice-skin)"/><path d="M34 84 v-30 M54 78 v-40 M74 78 v-40 M94 90 v-26" stroke="var(--alice-skin)" stroke-width="14" stroke-linecap="round"/></svg></div>
<div class="lq__lobster-held">${figure('lobster')}</div>
<div class="lq__hand lq__hand--right"><svg viewBox="0 0 120 160" focusable="false"><path d="M20 160 L20 80 Q30 40 60 46 Q90 40 100 80 L100 160 Z" fill="var(--alice-skin)"/><path d="M26 90 v-26 M46 78 v-40 M66 78 v-40 M86 84 v-30" stroke="var(--alice-skin)" stroke-width="14" stroke-linecap="round"/></svg></div>`;

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
