/** The Dormouse on the rim, and the teapot he ends up in. Decorative SVG. */

export const TEAPOT_SVG = `
<svg viewBox="0 0 160 120" focusable="false">
  <path d="M40 60 C40 30 120 30 120 60 L124 96 Q124 108 112 108 L48 108 Q36 108 36 96 Z" fill="var(--dm-china)"/>
  <path d="M120 62 C146 56 154 72 140 90" stroke="var(--dm-china)" stroke-width="10" fill="none" stroke-linecap="round"/>
  <path d="M40 66 C10 62 8 96 40 92" stroke="var(--dm-china)" stroke-width="10" fill="none" stroke-linecap="round"/>
  <g class="dm__lid">
    <path d="M52 40 Q80 20 108 40 Z" fill="var(--dm-china-shade)"/>
    <circle cx="80" cy="26" r="6" fill="var(--dm-china-shade)"/>
  </g>
  <path d="M56 72 q24 18 48 0" stroke="var(--world-water)" stroke-width="4" fill="none" stroke-linecap="round"/>
</svg>`;

/** The sisters' little bucket, drawn about its middle so it can ride the spiral:
    a pail with a handle, brimming with treacle that runs over its lip. */
export const BUCKET_INNER = `
  <path d="M-16 -13 Q0 -36 16 -13" stroke="var(--ink-primary)" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M-15 -12 L-11 15 Q0 19 11 15 L15 -12 Z" fill="var(--sepia-light)" stroke="var(--ink-primary)" stroke-width="2.6" stroke-linejoin="round"/>
  <path d="M-13.4 -1 H13.4 M-12.2 7 H12.2" stroke="var(--sepia-dark)" stroke-width="1.8"/>
  <ellipse cx="0" cy="-12" rx="15" ry="4.6" fill="var(--dm-treacle-shine)" stroke="var(--ink-primary)" stroke-width="2.2"/>
  <path d="M9 -9 Q11.5 -1 9.5 4 Q7.5 -1 9 -9 Z" fill="var(--dm-treacle-shine)"/>`;

/** Things that begin with an M, as the sisters drew them: pictures, no words. */
export const M_PICTURES: readonly string[] = [
  // A mouse-trap, with its cheese.
  `<svg viewBox="0 0 100 80" focusable="false">
  <rect x="8" y="44" width="84" height="22" rx="3" fill="var(--sepia-light)" stroke="var(--ink-primary)" stroke-width="3"/>
  <path d="M22 44 V22 H66 V44" fill="none" stroke="var(--ink-primary)" stroke-width="4" stroke-linejoin="round"/>
  <circle cx="22" cy="46" r="4.5" fill="var(--ink-secondary)"/>
  <path d="M60 44 H86 V28 Z" fill="var(--world-glow)" stroke="var(--ink-primary)" stroke-width="2.6" stroke-linejoin="round"/>
  <circle cx="77" cy="39" r="2.2" fill="var(--sepia-mid)"/>
</svg>`,
  // The moon.
  `<svg viewBox="0 0 100 100" focusable="false">
  <path d="M62 10 A42 42 0 1 0 62 90 A46 46 0 0 1 62 10 Z" fill="var(--world-glow)" stroke="var(--ink-primary)" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="34" cy="40" r="3" fill="var(--sepia-light)"/><circle cx="28" cy="62" r="4" fill="var(--sepia-light)"/>
</svg>`,
  // Memory: a knot tied in a string, so as not to forget.
  `<svg viewBox="0 0 100 80" focusable="false">
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 58 C20 58 30 50 40 40 C52 28 66 26 66 38 C66 50 48 54 42 44 C36 34 56 24 70 30 C80 34 88 40 96 38" stroke="var(--ink-primary)" stroke-width="11"/>
    <path d="M4 58 C20 58 30 50 40 40 C52 28 66 26 66 38 C66 50 48 54 42 44 C36 34 56 24 70 30 C80 34 88 40 96 38" stroke="var(--paper-base)" stroke-width="6"/>
  </g>
</svg>`,
];
