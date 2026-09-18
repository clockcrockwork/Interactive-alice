/** The wood's own props: a bare bough, a grin alone, and a signpost. */

export const BARE_BOUGH_SVG = `
<svg viewBox="0 0 400 240" focusable="false">
  <path d="M0 200 C80 180 140 190 220 176 C300 162 340 170 400 150" stroke="oklch(24% 0.05 60)" stroke-width="22" fill="none" stroke-linecap="round"/>
</svg>`;

export const GRIN_SVG = `
<svg viewBox="0 0 100 60" focusable="false">
  <path d="M6 16 Q50 56 94 16" stroke="var(--cc-grin)" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M16 22 v8 M32 32 v10 M50 36 v11 M68 32 v10 M84 22 v8" stroke="var(--cc-grin)" stroke-width="3.5" stroke-linecap="round"/>
</svg>`;

export const signSvg = (direction: 'left' | 'right'): string => `
<svg viewBox="0 0 100 130" focusable="false">
  <rect x="46" y="40" width="8" height="90" fill="var(--cc-sign)"/>
  <g class="cc__sign-arrow" transform="${direction === 'left' ? 'scale(-1 1) translate(-100 0)' : ''}">
    <path d="M10 22 L74 22 L92 38 L74 54 L10 54 Z" fill="var(--cc-sign)" stroke="var(--cc-grin)" stroke-width="3"/>
    <path d="M24 38 h44" stroke="var(--cc-grin)" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`;
