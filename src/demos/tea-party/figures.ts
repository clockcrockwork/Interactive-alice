/**
 * The tea-table's own things: scenery and props, drawn once as SVG. One place
 * setting is a symbol every seat reuses; the watch, the cup it goes into, the
 * raven and the writing-desk, the house with ears on its chimneys, the sun that
 * is also Time's clock. No words anywhere: the watch's face is numbers only.
 */

/** One laid place, seen a little from above: saucer, cup, plate and spoon; and
    the mess that appears on it once it has been used (`--dirt`). */
export const SETTING_SYMBOL = `
<svg class="tp__defs" width="0" height="0" focusable="false" aria-hidden="true">
  <symbol id="tp-setting" viewBox="0 0 160 120">
    <ellipse cx="104" cy="92" rx="44" ry="14" fill="var(--tp-china-shade)"/>
    <ellipse cx="104" cy="88" rx="40" ry="12" fill="var(--tp-china)"/>
    <ellipse cx="104" cy="88" rx="26" ry="7" fill="none" stroke="var(--tp-china-rim)" stroke-width="2"/>
    <ellipse cx="46" cy="94" rx="34" ry="11" fill="var(--tp-china-shade)"/>
    <ellipse cx="46" cy="91" rx="30" ry="9" fill="var(--tp-china)"/>
    <path d="M26 58 h40 v22 q0 14 -20 14 q-20 0 -20 -14 z" fill="var(--tp-china)"/>
    <ellipse cx="46" cy="58" rx="20" ry="6" fill="var(--tp-china-shade)"/>
    <ellipse cx="46" cy="58" rx="15" ry="4" fill="var(--tp-tea)"/>
    <path d="M66 64 q14 2 12 14 q-2 8 -12 8" stroke="var(--tp-china)" stroke-width="5" fill="none"/>
    <path d="M120 70 l22 16" stroke="var(--tp-china-shade)" stroke-width="4" stroke-linecap="round"/>
    <g style="opacity: var(--dirt, 0)">
      <ellipse cx="104" cy="86" rx="16" ry="5" fill="var(--tp-stain)"/>
      <path d="M86 84 q6 -8 14 -2 M110 80 q8 -4 12 4" stroke="var(--tp-stain)" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M30 60 l-12 -30 h38 l-10 30 z" fill="var(--tp-china)" transform="rotate(-70 46 60)"/>
      <ellipse cx="46" cy="58" rx="15" ry="4" fill="var(--tp-stain)"/>
      <circle cx="70" cy="100" r="3" fill="var(--tp-crumb)"/>
      <circle cx="126" cy="104" r="2.5" fill="var(--tp-crumb)"/>
      <circle cx="140" cy="96" r="2" fill="var(--tp-crumb)"/>
    </g>
  </symbol>
</svg>`;

export const SETTING_USE = `<svg class="tp__setting" viewBox="0 0 160 120" focusable="false"><use href="#tp-setting"/></svg>`;

/** The Hatter's frown, laid over his face in the figure's own box: brows that
    come down and a mouth that turns, shown by `--frown`. */
export const FROWN_SVG = `
<svg class="tp__frown" viewBox="0 0 160 260" focusable="false" aria-hidden="true">
  <g class="tp__brows">
    <path d="M52 90 l22 7 M108 90 l-22 7" stroke="var(--ink-primary)" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>
  <g class="tp__mouth">
    <ellipse cx="80" cy="119" rx="14" ry="5" fill="var(--paper-warm)"/>
    <path d="M70 122 q10 -7 20 0" stroke="var(--ink-secondary)" stroke-width="3" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;

/** The teapot nearest Alice: its lid lifts (`--lid`) and there is nothing but tea. */
export const TEAPOT_SVG = `
<svg viewBox="0 0 200 150" focusable="false">
  <ellipse cx="100" cy="140" rx="70" ry="10" fill="var(--tp-shadow)"/>
  <path d="M46 70 C46 36 154 36 154 70 L160 118 Q160 134 142 134 L58 134 Q40 134 40 118 Z" fill="var(--tp-china)"/>
  <path d="M154 74 C186 66 196 88 176 110" stroke="var(--tp-china)" stroke-width="12" fill="none" stroke-linecap="round"/>
  <path d="M46 78 C8 72 6 114 46 108" stroke="var(--tp-china)" stroke-width="12" fill="none" stroke-linecap="round"/>
  <path d="M60 96 q40 20 80 0" stroke="var(--tp-china-rim)" stroke-width="4" fill="none" stroke-linecap="round"/>
  <ellipse cx="100" cy="52" rx="42" ry="10" fill="var(--tp-tea)"/>
  <g class="tp__lid">
    <path d="M58 52 Q100 24 142 52 Z" fill="var(--tp-china-shade)"/>
    <ellipse cx="100" cy="52" rx="44" ry="8" fill="var(--tp-china)"/>
    <circle cx="100" cy="30" r="7" fill="var(--tp-china-shade)"/>
  </g>
  <g class="tp__steam">
    <path d="M80 40 q-8 -14 0 -28 M100 36 q-10 -16 0 -32 M120 40 q-8 -14 0 -28" stroke="var(--tp-steam)" stroke-width="5" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;

/**
 * The watch that tells the day of the month: a ring of dates and one hand. The
 * dates are numbers on display, so they are written by the page's own number
 * format (`shell.locale.numberFormat()`), handed in.
 */
export function watchSvg(format: (n: number) => string = String): string {
  const dates = Array.from({ length: 31 }, (_, i) => {
    const a = ((i + 1) / 31) * Math.PI * 2 - Math.PI / 2;
    const x = 200 + Math.cos(a) * 150;
    const y = 200 + Math.sin(a) * 150 + 6;
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${i % 5 === 4 ? 20 : 14}" text-anchor="middle">${format(i + 1)}</text>`;
  }).join('');
  return `
<svg viewBox="0 0 400 440" focusable="false">
  <rect x="184" y="0" width="32" height="40" rx="8" fill="var(--tp-brass)"/>
  <circle cx="200" cy="18" r="16" fill="var(--tp-brass)"/>
  <circle cx="200" cy="220" r="196" fill="var(--tp-brass-deep)"/>
  <circle cx="200" cy="220" r="184" fill="var(--tp-brass)"/>
  <circle cx="200" cy="220" r="170" fill="var(--tp-china)"/>
  <circle cx="200" cy="220" r="128" fill="none" stroke="var(--tp-china-rim)" stroke-width="2"/>
  <g class="tp__dates" transform="translate(0 20)">${dates}</g>
  <g class="tp__watch-hand">
    <path d="M200 232 L200 108" stroke="var(--ink-primary)" stroke-width="6" stroke-linecap="round"/>
    <path d="M200 108 l-8 16 h16 z" fill="var(--ink-primary)"/>
    <circle cx="200" cy="220" r="9" fill="var(--ink-primary)"/>
  </g>
  <g class="tp__smear">
    <path d="M90 170 C130 120 230 110 300 150 C330 190 300 260 230 280 C170 300 110 260 90 170 Z" fill="var(--tp-butter)"/>
    <path d="M120 180 q60 -40 150 -10" stroke="var(--tp-butter-deep)" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.5"/>
  </g>
  <g class="tp__crumbs">
    <rect x="150" y="190" width="9" height="7" rx="2" fill="var(--tp-crumb)"/>
    <rect x="236" y="176" width="7" height="6" rx="2" fill="var(--tp-crumb)"/>
    <rect x="200" y="250" width="8" height="8" rx="2" fill="var(--tp-crumb)"/>
    <rect x="124" y="236" width="6" height="6" rx="2" fill="var(--tp-crumb)"/>
    <rect x="262" y="236" width="8" height="6" rx="2" fill="var(--tp-crumb)"/>
  </g>
</svg>`;
}

/** The knife that spreads the best butter, and the butter itself on its dish. */
export const KNIFE_SVG = `
<svg viewBox="0 0 300 60" focusable="false">
  <path d="M0 30 L160 12 Q200 10 200 30 Q200 50 160 48 Z" fill="var(--tp-china-shade)"/>
  <rect x="196" y="18" width="100" height="24" rx="10" fill="var(--sepia-deep)"/>
  <path d="M60 20 q40 -10 90 2" stroke="var(--tp-butter)" stroke-width="8" stroke-linecap="round" fill="none"/>
</svg>`;

export const BUTTER_SVG = `
<svg viewBox="0 0 160 90" focusable="false">
  <ellipse cx="80" cy="76" rx="76" ry="12" fill="var(--tp-china-shade)"/>
  <ellipse cx="80" cy="72" rx="68" ry="10" fill="var(--tp-china)"/>
  <path d="M34 66 L40 34 L128 28 L122 66 Z" fill="var(--tp-butter)"/>
  <path d="M40 34 L128 28 L130 20 L44 26 Z" fill="var(--tp-butter-deep)"/>
  <circle cx="60" cy="48" r="3" fill="var(--tp-crumb)"/>
  <circle cx="98" cy="44" r="2.5" fill="var(--tp-crumb)"/>
</svg>`;

/** The March Hare's cup of tea, in two halves so the watch can go in between. */
export const CUP_BACK_SVG = `
<svg viewBox="0 0 300 220" focusable="false">
  <ellipse cx="150" cy="60" rx="120" ry="34" fill="var(--tp-china-shade)"/>
  <ellipse cx="150" cy="60" rx="104" ry="26" fill="var(--tp-tea)"/>
  <g class="tp__rings">
    <ellipse class="tp__ring" cx="150" cy="60" rx="30" ry="8" fill="none" stroke="var(--tp-china)" stroke-width="3"/>
    <ellipse class="tp__ring tp__ring--2" cx="150" cy="60" rx="30" ry="8" fill="none" stroke="var(--tp-china)" stroke-width="3"/>
    <ellipse class="tp__ring tp__ring--3" cx="150" cy="60" rx="30" ry="8" fill="none" stroke="var(--tp-china)" stroke-width="3"/>
  </g>
</svg>`;

export const CUP_FRONT_SVG = `
<svg viewBox="0 0 300 220" focusable="false">
  <path d="M30 60 Q30 200 150 200 Q270 200 270 60 Q150 110 30 60 Z" fill="var(--tp-china)"/>
  <path d="M30 60 Q150 100 270 60" fill="none" stroke="var(--tp-china-rim)" stroke-width="3"/>
  <path d="M270 90 C320 80 330 150 266 160" stroke="var(--tp-china)" stroke-width="16" fill="none" stroke-linecap="round"/>
  <ellipse cx="150" cy="206" rx="130" ry="12" fill="var(--tp-china-shade)"/>
</svg>`;

/** The riddle's two halves, as paper cut-outs. */
export const RAVEN_SVG = `
<svg viewBox="0 0 240 200" focusable="false">
  <path d="M30 140 C20 90 60 60 110 62 C140 62 160 50 176 36 L196 40 L212 56 L190 60 C180 90 180 130 150 150 L160 180 L140 176 L132 152 L100 154 L108 180 L88 178 L80 150 C50 150 36 150 30 140 Z" fill="var(--tp-ink-cut)"/>
  <circle cx="178" cy="48" r="3" fill="var(--paper-base)"/>
  <path d="M196 40 L236 44 L212 56 Z" fill="var(--tp-ink-cut)"/>
  <path d="M40 150 l-30 30 M60 154 l-10 34" stroke="var(--tp-ink-cut)" stroke-width="5" stroke-linecap="round"/>
</svg>`;

export const DESK_SVG = `
<svg viewBox="0 0 240 200" focusable="false">
  <path d="M20 40 L220 40 L240 100 L0 100 Z" fill="var(--tp-wood)"/>
  <rect x="0" y="100" width="240" height="14" fill="var(--tp-wood-deep)"/>
  <rect x="10" y="114" width="16" height="80" fill="var(--tp-wood-deep)"/>
  <rect x="214" y="114" width="16" height="80" fill="var(--tp-wood-deep)"/>
  <rect x="36" y="118" width="60" height="30" fill="var(--tp-wood)"/>
  <rect x="144" y="118" width="60" height="30" fill="var(--tp-wood)"/>
  <circle cx="66" cy="133" r="4" fill="var(--tp-brass)"/>
  <circle cx="174" cy="133" r="4" fill="var(--tp-brass)"/>
  <path d="M90 70 l50 -12 l12 30 l-50 12 z" fill="var(--paper-base)"/>
  <path d="M164 28 l-6 44 M158 72 l-8 10 l14 -4 z" stroke="var(--tp-ink-cut)" stroke-width="4" fill="var(--tp-ink-cut)" stroke-linecap="round"/>
  <path d="M180 60 h30 v16 h-30 z" fill="var(--tp-ink-cut)"/>
</svg>`;

/** The March Hare's house: ears for chimneys, a thatch of fur, a clock on the wall. */
export const HOUSE_SVG = `
<svg viewBox="0 0 400 300" focusable="false">
  <path d="M96 96 q-30 -70 -4 -90 q22 24 30 86 z" fill="var(--tp-house)"/>
  <path d="M100 92 q-16 -54 -2 -70 q10 20 14 68 z" fill="var(--tp-house-ear)"/>
  <path d="M304 96 q30 -70 4 -90 q-22 24 -30 86 z" fill="var(--tp-house)"/>
  <path d="M300 92 q16 -54 2 -70 q-10 20 -14 68 z" fill="var(--tp-house-ear)"/>
  <rect x="80" y="88" width="40" height="40" fill="var(--tp-house-deep)"/>
  <rect x="280" y="88" width="40" height="40" fill="var(--tp-house-deep)"/>
  <path d="M30 150 L200 60 L370 150 Z" fill="var(--tp-thatch)"/>
  <path d="M40 150 q80 -14 160 0 q80 14 160 0 L360 160 L40 160 Z" fill="var(--tp-thatch-deep)"/>
  <rect x="60" y="150" width="280" height="140" fill="var(--tp-house)"/>
  <rect x="170" y="200" width="60" height="90" rx="30" fill="var(--tp-house-deep)"/>
  <rect x="90" y="190" width="50" height="50" fill="var(--tp-window)"/>
  <rect x="260" y="190" width="50" height="50" fill="var(--tp-window)"/>
  <path d="M90 215 h50 M115 190 v50 M260 215 h50 M285 190 v50" stroke="var(--tp-house)" stroke-width="4"/>
  <g class="tp__house-clock">
    <circle cx="200" cy="120" r="26" fill="var(--tp-china)" stroke="var(--tp-brass-deep)" stroke-width="4"/>
    <g class="tp__house-hands">
      <path d="M200 120 v-18" stroke="var(--ink-primary)" stroke-width="3" stroke-linecap="round"/>
      <path d="M200 120 h12" stroke="var(--ink-primary)" stroke-width="3" stroke-linecap="round"/>
    </g>
  </g>
</svg>`;

/** The tree the table is set under: a trunk and a round crown. */
export const TREE_SVG = `
<svg viewBox="0 0 300 400" focusable="false">
  <path d="M136 400 L140 240 L160 240 L166 400 Z" fill="var(--tp-bark)"/>
  <path d="M150 240 q-40 -30 -80 -10 M150 250 q50 -40 90 -20" stroke="var(--tp-bark)" stroke-width="12" fill="none" stroke-linecap="round"/>
  <ellipse cx="150" cy="150" rx="140" ry="120" fill="var(--tp-leaf)"/>
  <ellipse cx="110" cy="120" rx="80" ry="70" fill="var(--tp-leaf-light)"/>
  <ellipse cx="200" cy="170" rx="70" ry="60" fill="var(--tp-leaf-deep)"/>
</svg>`;

/** The tea-tray the bat flies like: a plate with a rim. */
export const TRAY_SVG = `
<svg viewBox="0 0 160 50" focusable="false">
  <ellipse cx="80" cy="25" rx="78" ry="22" fill="var(--tp-china-shade)"/>
  <ellipse cx="80" cy="22" rx="66" ry="16" fill="var(--tp-china)"/>
</svg>`;

/** What the Dormouse sings in its sleep: three notes in ink, rising. */
export const NOTES_SVG = `
<svg viewBox="0 0 120 80" focusable="false">
  <g class="tp__note"><ellipse cx="18" cy="66" rx="9" ry="6.5" transform="rotate(-20 18 66)" fill="var(--ink-primary)"/><path d="M26 63 V24" stroke="var(--ink-primary)" stroke-width="3"/><path d="M26 24 q10 6 8 16" stroke="var(--ink-primary)" stroke-width="3" fill="none"/></g>
  <g class="tp__note tp__note--2"><ellipse cx="56" cy="52" rx="8" ry="6" transform="rotate(-20 56 52)" fill="var(--ink-primary)"/><path d="M63 49 V14" stroke="var(--ink-primary)" stroke-width="3"/></g>
  <g class="tp__note tp__note--3"><ellipse cx="92" cy="60" rx="8" ry="6" transform="rotate(-20 92 60)" fill="var(--ink-primary)"/><ellipse cx="110" cy="54" rx="8" ry="6" transform="rotate(-20 110 54)" fill="var(--ink-primary)"/><path d="M99 57 V20 L117 14 V51" stroke="var(--ink-primary)" stroke-width="3" fill="none"/></g>
</svg>`;
