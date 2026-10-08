/** The Mock Turtle's props: the shore in layers, the ledge of rock, and the school in the sea. */

import { figure } from '../art/art.ts';
import { DANCERS } from '../art/vectors.ts';

/** The shore: sky and sun, three swells of sea in a wrapper that heaves, the
    ledge of rock the Mock Turtle sits on (with the shadow it casts), the grass
    above the shore, and shingle. Each band carries its own parallax rate for the
    walk along the shore. */
export const SHORE_HTML = `
<div class="mt__sky"><div class="mt__sun"></div></div>
<div class="mt__swell">
  <div class="mt__sea mt__sea--far"></div>
  <div class="mt__sea mt__sea--mid"></div>
  <div class="mt__sea mt__sea--near"></div>
  <div class="mt__ripple"></div>
  <div class="mt__ripple"></div>
  <div class="mt__ripple"></div>
</div>
<div class="mt__shingle"></div>
<div class="mt__ledge">
  <div class="mt__shade mt__shade--ledge"><div class="mt__shade-blob"></div></div>
  <svg viewBox="0 0 320 140" preserveAspectRatio="none" focusable="false">
    <path d="M0 140 L10 70 Q40 30 110 34 L180 20 Q260 10 300 40 L320 140 Z" fill="var(--sepia-mid)"/>
    <path d="M30 80 Q90 50 150 60 Q230 40 290 70" stroke="oklch(from var(--ink-primary) l c h / 0.15)" stroke-width="8" fill="none"/>
    <path d="M60 110 Q140 90 230 100" stroke="var(--lq-paper-faint)" stroke-width="6" fill="none"/>
  </svg>
</div>
<div class="mt__grass"></div>`;

/** A row of desks with a pupil at each: the little sea-creatures, drawn by the art layer. */
function row(kinds: readonly string[], className: string): string {
  const desks = kinds
    .map(
      (kind, index) =>
        `<div class="mt__desk" style="--i: ${index}"><div class="mt__pupil">${figure(`dancer/${kind}`)}</div><div class="mt__desk-top"></div></div>`,
    )
    .join('');
  return `<div class="mt__row ${className}">${desks}</div>`;
}

/** The school in the sea, in depth: the deep water under its bright surface,
    light caustics, the old Tortoise at the back with his cane, three rows of
    desks, and the sand. */
export function schoolMarkup(lite: boolean): string {
  const pupils = [...DANCERS, ...DANCERS];
  const far = pupils.slice(0, lite ? 3 : 4);
  const mid = pupils.slice(4, lite ? 6 : 7);
  const near = pupils.slice(7, lite ? 8 : 9);
  return `
<div class="mt__deep"></div>
<div class="mt__surface"></div>
<div class="mt__caustic mt__caustic--a"></div>
<div class="mt__caustic mt__caustic--b"></div>
<div class="mt__school-world">
  <div class="mt__sand"></div>
  <div class="mt__master">${figure('tortoise-master')}</div>
  ${row(far, 'mt__row--far')}
  ${row(mid, 'mt__row--mid')}
  ${row(near, 'mt__row--near')}
</div>
<div class="mt__bubbles"></div>`;
}

/** The Gryphon's two forepaws, raised to hide its face: drawn over the figure in
    the same 240 by 220 box, each swinging up from its shoulder with `--hide`. */
export const GRYPHON_PAWS = `
<svg class="mt__paws" viewBox="0 0 240 220" focusable="false">
  <g class="mt__paw mt__paw--left">
    <path d="M118 176 Q124 120 142 80" stroke="var(--lq-gryphon, var(--sepia-mid))" stroke-width="20" fill="none" stroke-linecap="round"/>
    <ellipse cx="144" cy="70" rx="20" ry="17" fill="var(--lq-gryphon, var(--sepia-mid))"/>
    <path d="M132 58 l-4 -8 M144 54 l0 -9 M156 58 l4 -8" stroke="var(--sepia-deep)" stroke-width="3.5" stroke-linecap="round"/>
  </g>
  <g class="mt__paw mt__paw--right">
    <path d="M200 176 Q194 120 180 80" stroke="var(--lq-gryphon, var(--sepia-mid))" stroke-width="20" fill="none" stroke-linecap="round"/>
    <ellipse cx="178" cy="68" rx="21" ry="18" fill="var(--lq-gryphon, var(--sepia-mid))"/>
    <path d="M166 56 l-4 -8 M178 52 l0 -9 M190 56 l4 -8" stroke="var(--sepia-deep)" stroke-width="3.5" stroke-linecap="round"/>
  </g>
</svg>`;

/** The Mock Turtle's two flappers, drawn over his figure in the same box: they
    cross over his face with `--hide`, and the right one counts off the subjects
    with `--count`. */
export const TURTLE_FLAPPERS = `
<svg class="mt__paws" viewBox="0 0 240 220" focusable="false">
  <g class="mt__paw mt__paw--left">
    <path d="M58 140 Q72 92 128 50 Q148 40 142 60 Q112 104 74 150 Z" fill="var(--lq-turtle, var(--sepia-mid))"/>
    <path d="M70 132 Q90 96 132 58" stroke="oklch(from var(--ink-primary) l c h / 0.18)" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>
  <g class="mt__paw mt__paw--right">
    <path d="M182 140 Q168 92 112 50 Q92 40 98 60 Q128 104 166 150 Z" fill="var(--lq-turtle, var(--sepia-mid))"/>
    <path d="M170 132 Q150 96 108 58" stroke="oklch(from var(--ink-primary) l c h / 0.18)" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;
