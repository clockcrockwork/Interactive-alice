/** Paper-theatre cutouts for the trial. Decorative SVG, drawn once. */

/** What the reader kept along the way, come to rest on the bank at the end. */
const KEEPSAKES: Record<string, string> = {
  daisy: `<svg viewBox="0 0 60 60" focusable="false"><g fill="var(--paper-base)"><ellipse cx="30" cy="12" rx="6" ry="11"/><ellipse cx="30" cy="48" rx="6" ry="11"/><ellipse cx="12" cy="30" rx="11" ry="6"/><ellipse cx="48" cy="30" rx="11" ry="6"/><ellipse cx="17" cy="17" rx="8" ry="8"/><ellipse cx="43" cy="17" rx="8" ry="8"/><ellipse cx="17" cy="43" rx="8" ry="8"/><ellipse cx="43" cy="43" rx="8" ry="8"/></g><circle cx="30" cy="30" r="8" fill="var(--world-glow)"/><circle cx="30" cy="30" r="8" fill="none" stroke="var(--ink-faded)" stroke-width="1"/></svg>`,
  jar: `<svg viewBox="0 0 60 60" focusable="false"><rect x="16" y="6" width="28" height="8" rx="2" fill="var(--sepia-dark)"/><rect x="12" y="14" width="36" height="42" rx="6" fill="var(--paper-aged)"/><rect x="15" y="22" width="30" height="30" rx="4" fill="color-mix(in oklab, var(--sepia-mid) 55%, var(--world-glow))"/><rect x="18" y="28" width="24" height="12" fill="var(--paper-base)"/><path d="M21 34 h18" stroke="var(--ink-secondary)" stroke-width="2"/></svg>`,
  book: `<svg viewBox="0 0 60 60" focusable="false"><rect x="10" y="8" width="40" height="46" rx="3" fill="var(--sepia-dark)"/><rect x="14" y="12" width="32" height="38" fill="var(--paper-warm)"/><path d="M19 20 h22 M19 26 h22 M19 32 h16" stroke="var(--ink-ghost)" stroke-width="2"/><rect x="10" y="8" width="6" height="46" fill="var(--sepia-deep)"/></svg>`,
  key: `<svg viewBox="0 0 60 60" focusable="false"><circle cx="18" cy="30" r="11" fill="none" stroke="var(--ix-gold)" stroke-width="6"/><path d="M29 30 h26 v8 h-6 v-4 h-5 v6 h-6 v-6 h-9 z" fill="var(--ix-gold)"/></svg>`,
  comfit: `<svg viewBox="0 0 60 60" focusable="false"><circle cx="30" cy="30" r="14" fill="color-mix(in oklab, var(--ix-pink) 55%, var(--paper-warm))"/><circle cx="25" cy="25" r="4" fill="var(--paper-base)" opacity="0.7"/></svg>`,
  rose: `<svg viewBox="0 0 60 60" focusable="false"><path d="M30 52 v-16" stroke="var(--world-leaf-deep)" stroke-width="3"/><ellipse cx="22" cy="44" rx="7" ry="3" fill="var(--world-leaf)" transform="rotate(-30 22 44)"/><circle cx="30" cy="26" r="13" fill="var(--wonder-red)"/><circle cx="30" cy="26" r="7" fill="var(--wonder-red-light)"/><circle cx="30" cy="26" r="3" fill="var(--wonder-red-dark)"/></svg>`,
  lobster: `<svg viewBox="0 0 60 60" focusable="false"><ellipse cx="32" cy="32" rx="14" ry="9" fill="var(--wonder-red)"/><path d="M18 32 q-8 -10 -2 -16 M18 32 q-8 10 -2 16" stroke="var(--wonder-red)" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M46 32 q10 -2 12 6 M46 32 q10 2 12 -6" stroke="var(--wonder-red-dark)" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="24" cy="29" r="1.6" fill="var(--ink-primary)"/></svg>`,
};

export const keepsakeSvg = (kind: string): string => KEEPSAKES[kind] ?? '';

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

/** The witness-box: a railed stand with a step, empty until a witness is called. */
export const WITNESS_BOX_SVG = `
<svg viewBox="0 0 200 180" focusable="false">
  <rect x="20" y="150" width="160" height="30" fill="var(--sepia-deep)"/>
  <rect x="30" y="86" width="140" height="68" rx="4" fill="var(--sepia-dark)"/>
  <rect x="30" y="80" width="140" height="10" rx="3" fill="var(--sepia-mid)"/>
  <path d="M44 86 v-30 M72 86 v-30 M100 86 v-30 M128 86 v-30 M156 86 v-30" stroke="var(--sepia-mid)" stroke-width="5" stroke-linecap="round"/>
  <rect x="34" y="50" width="132" height="8" rx="3" fill="var(--sepia-mid)"/>
  <path d="M40 120 h120" stroke="oklch(from var(--ink-primary) l c h / 0.2)" stroke-width="3"/>
</svg>`;
