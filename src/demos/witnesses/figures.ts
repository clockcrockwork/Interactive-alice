/** Paper-theatre props for the witnesses. Decorative SVG, drawn once. */

/** The Hatter's teacup, held up; it drops at "on one knee". */
export const TEACUP_SVG = `
<svg viewBox="0 0 60 44" focusable="false">
  <path d="M8 10 h36 v12 q0 14 -18 14 q-18 0 -18 -14 Z" fill="var(--paper-base)"/>
  <path d="M44 14 q12 0 12 8 q0 8 -12 8" stroke="var(--paper-base)" stroke-width="4" fill="none"/>
  <ellipse cx="26" cy="12" rx="16" ry="4" fill="color-mix(in oklab, var(--sepia-mid) 70%, var(--paper-warm))"/>
  <ellipse cx="26" cy="40" rx="20" ry="4" fill="var(--paper-base)"/>
</svg>`;

/** A piece of bread-and-butter, getting thinner (`--thin`, 0..1 scales it down). */
export const BREAD_SVG = `
<svg viewBox="0 0 60 40" focusable="false">
  <path d="M4 36 L4 14 Q8 4 18 4 L52 4 Q56 4 56 10 L56 36 Z" fill="var(--paper-aged)"/>
  <path d="M8 34 L8 16 Q10 8 18 8 L50 8 L50 34 Z" fill="var(--paper-warm)"/>
  <path d="M10 14 h36" stroke="var(--world-glow)" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
</svg>`;

/** One shoe; two stand at the Hatter's feet and shake off while he trembles. */
export const SHOE_SVG = `
<svg viewBox="0 0 44 22" focusable="false">
  <path d="M2 18 Q2 6 16 6 L26 6 Q34 6 40 14 Q44 18 40 20 L4 20 Q2 20 2 18 Z" fill="var(--sepia-deep)"/>
  <path d="M14 6 L16 2 L24 2 L26 6" fill="var(--sepia-dark)"/>
  <circle cx="20" cy="10" r="1.6" fill="var(--paper-aged)"/>
</svg>`;

/**
 * The officers' canvas bag, which ties up at the mouth with strings. `--tied`
 * draws the strings; `--sat` is how far the officers have sat on it.
 */
export const BAG_SVG = `
<svg viewBox="0 0 120 120" focusable="false">
  <path class="wt__bag-body" d="M18 116 Q6 70 30 44 L90 44 Q114 70 102 116 Z" fill="var(--paper-aged)"/>
  <path d="M30 44 L90 44 L84 30 Q60 22 36 30 Z" fill="var(--sepia-light)"/>
  <path d="M24 60 q36 10 72 0 M22 84 q38 8 76 0" stroke="var(--sepia-mid)" stroke-width="2" fill="none"/>
  <path class="wt__bag-string" d="M34 34 q26 14 52 0 q-20 -22 -52 0 q24 10 52 -2" stroke="var(--sepia-deep)" stroke-width="3" fill="none" stroke-linecap="round" pathLength="1"/>
</svg>`;

/** The cook's pepper-box, held up and shaken. */
export const PEPPER_BOX_SVG = `
<svg viewBox="0 0 30 50" focusable="false">
  <rect x="6" y="14" width="18" height="34" rx="3" fill="var(--sepia-dark)"/>
  <path d="M6 20 h18" stroke="var(--paper-aged)" stroke-width="2"/>
  <rect x="8" y="4" width="14" height="12" rx="4" fill="var(--sepia-deep)"/>
  <circle cx="12" cy="8" r="1.2" fill="var(--paper-aged)"/><circle cx="18" cy="8" r="1.2" fill="var(--paper-aged)"/><circle cx="15" cy="12" r="1.2" fill="var(--paper-aged)"/>
</svg>`;

/**
 * The King's note-book, held in his hand: two scribbles (`--word-one`,
 * `--word-two`) write in, then the rule (`--word-rule`), still wet; and it shuts.
 */
export const NOTEBOOK_SVG = `
<svg viewBox="0 0 80 60" focusable="false">
  <g class="wt__notebook-cover">
    <rect x="4" y="4" width="72" height="52" rx="4" fill="var(--sepia-dark)"/>
    <rect x="8" y="8" width="64" height="44" rx="2" fill="var(--paper-warm)"/>
    <path class="wt__notebook-word wt__notebook-word--one" d="M14 18 q6 -6 10 0 t10 0 t10 0 t10 0 t8 0" stroke="var(--ink-secondary)" stroke-width="2" fill="none" stroke-linecap="round" pathLength="1"/>
    <path class="wt__notebook-word wt__notebook-word--two" d="M14 30 q6 -6 10 0 t10 0 t10 0 t10 0 t12 0" stroke="var(--ink-secondary)" stroke-width="2" fill="none" stroke-linecap="round" pathLength="1"/>
    <path class="wt__notebook-word wt__notebook-word--rule" d="M14 43 q5 -7 9 0 t9 0 t9 0 t9 0 t9 0 t9 0" stroke="var(--ink-primary)" stroke-width="2.8" fill="none" stroke-linecap="round" pathLength="1"/>
  </g>
</svg>`;

/** A glint of wet ink on the rule, lit once the pen has passed `--at`. */
const glint = (x: number): string =>
  `<ellipse class="wt__glint" style="--at: ${((x - 142) / 99).toFixed(2)}" cx="${x}" cy="47.6" rx="3.6" ry="1.3" fill="var(--paper-base)"/>`;

/**
 * The note-book seen close, over the King's shoulder: the older entries dry on
 * the left page, and on the right Rule Forty-two, a line of scribble still wet
 * and still being written (`--write`), the quill at its end. Caught at it, a blot
 * drops (`data-caught`) and the right-hand leaf swings shut (`--shut`).
 */
export const NOTEBOOK_OPEN_SVG = `
<svg viewBox="0 0 260 170" focusable="false">
  <rect x="2" y="6" width="256" height="160" rx="8" fill="var(--sepia-dark)"/>
  <path d="M10 12 Q70 4 128 14 L128 160 Q70 150 10 158 Z" fill="var(--paper-warm)"/>
  <g stroke="var(--ink-faded)" stroke-width="2" fill="none" stroke-linecap="round">
    <path d="M22 34 q5 -5 9 0 t9 0 t9 0 t9 0 t9 0 t9 0 t9 0 t9 0 t9 0"/>
    <path d="M22 52 q5 -5 9 0 t9 0 t9 0 t9 0 t9 0 t9 0"/>
    <path d="M22 70 q5 -5 9 0 t9 0 t9 0 t9 0 t9 0 t9 0 t9 0 t9 0"/>
    <path d="M22 88 q5 -5 9 0 t9 0 t9 0 t9 0"/>
  </g>
  <g stroke="var(--ink-secondary)" stroke-width="2.4" fill="none" stroke-linecap="round">
    <path d="M22 112 q5 -6 9 0 t9 0 t9 0 t9 0 t9 0"/>
    <path d="M22 132 q5 -6 9 0 t9 0 t9 0 t9 0 t9 0 t9 0 t9 0"/>
  </g>
  <g class="wt__peek-leaf">
    <path d="M132 14 Q190 4 250 12 L250 158 Q190 150 132 160 Z" fill="var(--paper-base)"/>
    <path class="wt__peek-rule" d="M142 52 q6 -9 11 0 t11 0 t11 0 t11 0 t11 0 t11 0 t11 0 t11 0 t11 0" stroke="var(--ink-primary)" stroke-width="3.6" fill="none" stroke-linecap="round" pathLength="1"/>
    <g class="wt__glints">${[147.5, 169.5, 191.5, 213.5, 235.5].map(glint).join('')}</g>
    <ellipse class="wt__peek-blot" cx="238" cy="64" rx="8.5" ry="6" fill="var(--ink-primary)"/>
    <path class="wt__peek-back" d="M132 14 Q190 4 250 12 L250 158 Q190 150 132 160 Z" fill="var(--sepia-dark)"/>
  </g>
  <path d="M130 12 V162" stroke="var(--sepia-deep)" stroke-width="3"/>
  <g class="wt__quill"><g class="wt__quill-hand"><g transform="translate(-4 0)">
    <path d="M146 52 L190 -6" stroke="var(--sepia-deep)" stroke-width="2"/>
    <path d="M152 42 C164 18 184 -2 198 -10 C190 10 176 30 156 46 Z" fill="var(--paper-aged)" stroke="var(--ink-faded)" stroke-width="1"/>
    <path d="M146 52 l3 -6 l3 2 z" fill="var(--ink-primary)"/>
  </g></g></g>
</svg>`;

/**
 * The letter: a sheet in three panels that unfold, with handwriting as lines of
 * scribble, no lettering. Four couplets, each a pair of lines, write in by
 * `--verse-n`; the first lines are what the Rabbit reads as "a letter".
 */
const scribble = (y: number, w: number): string => `M12 ${y} q5 -4 9 0 ${'t9 0 '.repeat(w).trim()}`;

const couplet = (n: number, y: number): string =>
  `<g class="wt__verse" style="--n: ${n}">` +
  `<path class="wt__hand" d="${scribble(y, 20)}" pathLength="1"/>` +
  `<path class="wt__hand" d="${scribble(y + 11, 16)}" pathLength="1"/>` +
  '</g>';

export const LETTER_SVG = `
<svg viewBox="0 0 220 160" focusable="false">
  <rect x="2" y="2" width="216" height="156" rx="3" fill="var(--paper-base)" stroke="var(--ink-ghost)" stroke-width="1.5"/>
  <path d="M74 2 v156 M146 2 v156" stroke="var(--ink-ghost)" stroke-width="1" stroke-dasharray="4 4"/>
  <g class="wt__hands">
    ${couplet(0, 24)}
    ${couplet(1, 58)}
    ${couplet(2, 92)}
    ${couplet(3, 126)}
  </g>
</svg>`;

/** A juryman sprawling: one creature of the box, thrown out on the crowd. */
export const SPRAWLER_SVG = `
<svg viewBox="0 0 40 40" focusable="false">
  <circle cx="20" cy="22" r="14" fill="var(--sepia-light)"/>
  <path d="M8 12 l-4 -10 l10 6 z M32 12 l4 -10 l-10 6 z" fill="var(--sepia-mid)"/>
  <circle cx="15" cy="20" r="2" fill="var(--ink-primary)"/><circle cx="25" cy="20" r="2" fill="var(--ink-primary)"/>
  <path d="M14 30 q6 -4 12 0" stroke="var(--ink-primary)" stroke-width="1.6" fill="none" stroke-linecap="round"/>
</svg>`;
