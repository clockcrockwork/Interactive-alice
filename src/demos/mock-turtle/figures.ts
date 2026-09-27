/** The Mock Turtle's props: the shore in layers, the ledge of rock, and the school in the sea. */

import { figure } from '../art/art.ts';
import { DANCERS } from '../art/vectors.ts';

/** The shore: sky and sun, three swells of sea in a wrapper that heaves, the
    ledge of rock the Mock Turtle sits on, the grass above the shore, and shingle.
    Each band carries its own parallax rate for the walk along the shore. */
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
  <svg viewBox="0 0 320 140" preserveAspectRatio="none" focusable="false">
    <path d="M0 140 L10 70 Q40 30 110 34 L180 20 Q260 10 300 40 L320 140 Z" fill="oklch(52% 0.04 70)"/>
    <path d="M30 80 Q90 50 150 60 Q230 40 290 70" stroke="oklch(0% 0 0 / 0.15)" stroke-width="8" fill="none"/>
    <path d="M60 110 Q140 90 230 100" stroke="oklch(100% 0 0 / 0.12)" stroke-width="6" fill="none"/>
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

/** The school in the sea, in depth: the deep water, light caustics, the old
    Tortoise at the back with his cane, three rows of desks, and the sand. */
export function schoolMarkup(lite: boolean): string {
  const pupils = [...DANCERS, ...DANCERS];
  const far = pupils.slice(0, lite ? 3 : 4);
  const mid = pupils.slice(4, lite ? 6 : 7);
  const near = pupils.slice(7, lite ? 8 : 9);
  return `
<div class="mt__deep"></div>
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
