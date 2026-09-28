/** Paper-theatre cutouts for the trial. Decorative SVG, drawn once. */

export const TARTS_SVG = `
<svg viewBox="0 0 260 140" focusable="false">
  <rect x="10" y="80" width="240" height="14" rx="4" fill="var(--sepia-dark)"/>
  <rect x="30" y="94" width="14" height="46" fill="var(--sepia-deep)"/>
  <rect x="216" y="94" width="14" height="46" fill="var(--sepia-deep)"/>
  <ellipse cx="130" cy="78" rx="96" ry="14" fill="var(--paper-base)"/>
  ${[60, 100, 140, 180, 200, 80, 120, 160]
    .map(
      (x, i) =>
        `<g transform="translate(${x} ${i < 5 ? 66 : 54})"><ellipse cx="0" cy="0" rx="18" ry="9" fill="var(--paper-aged)"/><ellipse cx="0" cy="-3" rx="11" ry="6" fill="var(--wonder-red)"/></g>`,
    )
    .join('')}
</svg>`;

/** The dream's own things, for the sister's dream: teacups and the pig-baby. */
export const TEACUPS_SVG = `
<svg viewBox="0 0 160 100" focusable="false">
  <path d="M20 40 h50 v22 q0 18 -25 18 q-25 0 -25 -18 Z" fill="currentColor"/>
  <path d="M70 46 q22 0 22 14 q0 14 -22 14" stroke="currentColor" stroke-width="6" fill="none"/>
  <path d="M90 30 h50 v22 q0 18 -25 18 q-25 0 -25 -18 Z" fill="currentColor"/>
  <ellipse cx="45" cy="86" rx="34" ry="6" fill="currentColor"/>
  <ellipse cx="115" cy="76" rx="34" ry="6" fill="currentColor"/>
</svg>`;

export const PIG_BABY_SVG = `
<svg viewBox="0 0 140 110" focusable="false">
  <ellipse cx="74" cy="70" rx="46" ry="30" fill="currentColor"/>
  <circle cx="40" cy="54" r="26" fill="currentColor"/>
  <ellipse cx="22" cy="60" rx="10" ry="7" fill="currentColor"/>
  <path d="M30 32 l-6 -18 l14 12 M52 32 l8 -18 l-14 12" fill="currentColor"/>
  <path d="M116 60 q14 -10 8 -22" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M50 96 v12 M96 96 v12" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
</svg>`;

/** What the dream's sounds would be if she opened her eyes: silhouettes of the farm. */
export const REAL_SVG: Record<string, string> = {
  grass: `<svg viewBox="0 0 140 110" focusable="false"><path d="M20 110 q10 -60 4 -90 q14 40 20 90 M50 110 q0 -70 -6 -100 q18 46 20 100 M80 110 q6 -60 -2 -96 q20 50 16 96 M110 110 q8 -50 0 -80 q14 36 12 80" stroke="currentColor" stroke-width="7" fill="none" stroke-linecap="round"/></svg>`,
  reeds: `<svg viewBox="0 0 140 110" focusable="false"><ellipse cx="70" cy="100" rx="70" ry="10" fill="currentColor" opacity="0.6"/><path d="M30 100 v-70 M60 100 v-90 M90 100 v-80 M116 100 v-60" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><ellipse cx="60" cy="14" rx="5" ry="12" fill="currentColor"/><ellipse cx="90" cy="24" rx="5" ry="12" fill="currentColor"/></svg>`,
  sheep: `<svg viewBox="0 0 140 110" focusable="false"><ellipse cx="80" cy="64" rx="46" ry="30" fill="currentColor"/><circle cx="30" cy="56" r="16" fill="currentColor"/><path d="M50 90 v16 M74 92 v14 M100 92 v14 M118 88 v18" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><circle class="tr__bell" cx="34" cy="80" r="6" fill="var(--world-glow)"/></svg>`,
  shepherd: `<svg viewBox="0 0 140 110" focusable="false"><circle cx="60" cy="24" r="14" fill="currentColor"/><path d="M40 110 L44 44 Q60 36 76 44 L80 110 Z" fill="currentColor"/><path d="M96 110 L96 30 q0 -14 14 -10" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`,
  hen: `<svg viewBox="0 0 140 110" focusable="false"><ellipse cx="74" cy="70" rx="40" ry="26" fill="currentColor"/><circle cx="40" cy="50" r="16" fill="currentColor"/><path d="M26 52 l-14 4 l14 6 z" fill="currentColor"/><path d="M34 34 l4 -12 l6 10 l6 -10 l2 12" fill="currentColor"/><path d="M110 60 l22 -20 M110 68 l26 -6" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><path d="M60 96 v14 M84 96 v14" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></svg>`,
  cow: `<svg viewBox="0 0 140 110" focusable="false"><rect x="30" y="40" width="90" height="46" rx="18" fill="currentColor"/><rect x="10" y="30" width="34" height="34" rx="12" fill="currentColor"/><path d="M14 30 q-8 -14 4 -18 M40 30 q8 -14 -4 -18" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M44 86 v20 M64 86 v20 M92 86 v20 M112 86 v20" stroke="currentColor" stroke-width="8" stroke-linecap="round"/></svg>`,
};
