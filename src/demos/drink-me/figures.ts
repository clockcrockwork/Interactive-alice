/** The key, the bottle and the cake. Their labels are filled in from the text
 * (label.ts reads them from the sentences that set them apart). */

/** A label's words as SVG text: escaped, since they come from the page's own text. */
const words = (label: string): string =>
  label.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** One side of the paper label round the bottle's neck: the words and nothing else,
 * stretched to fit whatever their length in whatever language. */
export const labelFaceSvg = (label: string): string => `
<svg viewBox="0 0 48 26" focusable="false">
  <rect x="1" y="1" width="46" height="24" rx="3" fill="var(--dk-label)" stroke="var(--sepia-dark)"/>
  <text class="dk__label-text" x="24" y="17.5" font-size="11" text-anchor="middle" textLength="38" lengthAdjust="spacingAndGlyphs">${words(label)}</text>
</svg>`;

export const KEY_SVG = `
<svg viewBox="0 0 60 24" focusable="false">
  <circle cx="11" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="4"/>
  <path d="M20 12 H56 M48 12 v8 M40 12 v6" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
</svg>`;

export const bottleSvg = (label: string): string => `
<svg viewBox="0 0 60 140" focusable="false">
  <rect x="22" y="2" width="16" height="14" rx="3" fill="var(--sepia-dark)"/>
  <path d="M20 16 h20 v22 q14 8 14 30 v60 q0 10 -10 10 h-28 q-10 0 -10 -10 v-60 q0 -22 14 -30 z" fill="var(--dk-glass)" stroke="var(--dk-glass-edge)" stroke-width="2"/>
  <g class="dk__liquid">
    <path d="M9 70 h42 v58 q0 8 -8 8 h-26 q-8 0 -8 -8 z" fill="var(--dk-drink)"/>
  </g>
  <rect x="6" y="52" width="48" height="26" rx="3" fill="var(--dk-label)" stroke="var(--sepia-dark)"/>
  <path d="M30 40 v12" stroke="var(--sepia-dark)" stroke-width="1.5"/>
  <text class="dk__label-text" x="30" y="70" font-size="11" text-anchor="middle" textLength="40" lengthAdjust="spacingAndGlyphs">${words(label)}</text>
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
