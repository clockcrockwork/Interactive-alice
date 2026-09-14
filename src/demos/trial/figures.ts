/** Paper-theatre cutouts for the trial. Decorative SVG, drawn once. */

const crown = (x: number, y: number, fill: string): string =>
  `<path d="M${x - 26} ${y} l6 -26 l12 14 l8 -22 l8 22 l12 -14 l6 26 z" fill="${fill}"/>`;

export const KING_SVG = `
<svg viewBox="0 0 160 240" focusable="false">
  <path d="M30 236 L28 120 Q30 92 80 92 Q130 92 132 120 L130 236 Z" fill="oklch(52% 0.18 25)"/>
  <path d="M60 236 L58 120 Q80 100 102 120 L100 236 Z" fill="oklch(92% 0.02 80)"/>
  <path d="M66 130 h28 v90 h-28 z" fill="oklch(52% 0.18 25)" opacity="0.5"/>
  <ellipse cx="80" cy="110" rx="46" ry="18" fill="oklch(94% 0.02 80)"/>
  <circle cx="80" cy="70" r="30" fill="oklch(88% 0.05 60)"/>
  <path d="M46 80 Q80 118 114 80 Q112 116 80 120 Q48 116 46 80 Z" fill="oklch(96% 0.01 80)"/>
  <path d="M40 66 Q30 40 46 30 Q60 18 80 22 Q100 18 114 30 Q130 40 120 66 Q110 46 80 46 Q50 46 40 66 Z" fill="oklch(96% 0.01 80)"/>
  ${crown(80, 26, 'oklch(80% 0.16 85)')}
  <circle cx="68" cy="68" r="3" fill="oklch(20% 0 0)"/>
  <circle cx="92" cy="68" r="3" fill="oklch(20% 0 0)"/>
  <path d="M70 84 q10 4 20 0" stroke="oklch(45% 0.1 30)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
</svg>`;

export const QUEEN_SVG = `
<svg viewBox="0 0 160 240" focusable="false">
  <path d="M18 236 Q14 120 80 96 Q146 120 142 236 Z" fill="oklch(48% 0.2 20)"/>
  <path d="M18 236 Q40 200 80 200 Q120 200 142 236 Z" fill="oklch(30% 0.12 20)"/>
  <path d="M60 130 l20 -16 l20 16 l-20 16 z" fill="oklch(92% 0.02 80)"/>
  <ellipse cx="80" cy="104" rx="40" ry="16" fill="oklch(94% 0.02 80)"/>
  <circle cx="80" cy="66" r="30" fill="oklch(90% 0.05 40)"/>
  <path d="M38 70 Q28 30 80 24 Q132 30 122 70 Q120 52 80 50 Q40 52 38 70 Z" fill="oklch(28% 0.06 40)"/>
  ${crown(80, 26, 'oklch(80% 0.16 85)')}
  <path class="tr__queen-brow" d="M62 58 l14 6 M98 58 l-14 6" stroke="oklch(20% 0 0)" stroke-width="3" stroke-linecap="round"/>
  <circle cx="68" cy="68" r="3.5" fill="oklch(20% 0 0)"/>
  <circle cx="92" cy="68" r="3.5" fill="oklch(20% 0 0)"/>
  <path class="tr__queen-mouth" d="M66 86 q14 -8 28 0" stroke="oklch(40% 0.2 20)" stroke-width="3" fill="none" stroke-linecap="round"/>
</svg>`;

export const RABBIT_HERALD_SVG = `
<svg viewBox="0 0 140 220" focusable="false">
  <path d="M40 216 L38 120 Q40 96 70 96 Q100 96 102 120 L100 216 Z" fill="oklch(52% 0.18 25)"/>
  <path d="M58 216 L58 120 Q70 110 82 120 L82 216 Z" fill="oklch(96% 0.01 80)"/>
  <ellipse cx="70" cy="84" rx="26" ry="22" fill="oklch(97% 0.01 80)"/>
  <path d="M52 66 L44 8 L64 62 M88 66 L96 8 L76 62" fill="oklch(97% 0.01 80)"/>
  <path d="M54 62 L48 20 L60 60 M86 62 L92 20 L80 60" fill="oklch(85% 0.08 20)"/>
  <circle cx="62" cy="82" r="3" fill="oklch(70% 0.2 20)"/>
  <circle cx="78" cy="82" r="3" fill="oklch(70% 0.2 20)"/>
  <path d="M100 130 L134 112 L134 124 L104 138 Z" fill="oklch(80% 0.16 85)"/>
  <rect x="8" y="126" width="34" height="60" rx="3" fill="oklch(92% 0.04 85)"/>
  <path d="M14 140 h22 M14 150 h22 M14 160 h16" stroke="oklch(45% 0.05 60)" stroke-width="2"/>
</svg>`;

export const KNAVE_SVG = `
<svg viewBox="0 0 140 220" focusable="false">
  <rect x="34" y="96" width="72" height="120" rx="6" fill="oklch(94% 0.02 80)" stroke="oklch(30% 0.05 30)" stroke-width="3"/>
  <path d="M70 120 C56 108 40 122 52 136 L70 152 L88 136 C100 122 84 108 70 120 Z" fill="oklch(58% 0.22 25)"/>
  <circle cx="70" cy="66" r="26" fill="oklch(90% 0.05 60)"/>
  <path d="M44 60 Q70 30 96 60 Q90 44 70 42 Q50 44 44 60 Z" fill="oklch(28% 0.06 40)"/>
  <path d="M40 40 h60 l-6 -18 h-48 z" fill="oklch(58% 0.22 25)"/>
  <circle cx="60" cy="68" r="2.5" fill="oklch(20% 0 0)"/>
  <circle cx="80" cy="68" r="2.5" fill="oklch(20% 0 0)"/>
  <path d="M30 150 q-14 10 0 24 M110 150 q14 10 0 24" stroke="oklch(40% 0.02 60)" stroke-width="5" fill="none"/>
  <circle cx="26" cy="170" r="6" fill="none" stroke="oklch(40% 0.02 60)" stroke-width="3"/>
  <circle cx="114" cy="170" r="6" fill="none" stroke="oklch(40% 0.02 60)" stroke-width="3"/>
</svg>`;

export const SOLDIER_SVG = `
<svg viewBox="0 0 120 220" focusable="false">
  <rect x="30" y="80" width="60" height="130" rx="5" fill="oklch(94% 0.02 80)" stroke="oklch(30% 0.02 30)" stroke-width="3"/>
  <path d="M60 128 l14 -20 l-14 -20 l-14 20 z" fill="oklch(28% 0.02 30)"/>
  <circle cx="60" cy="56" r="22" fill="oklch(90% 0.05 60)"/>
  <rect x="34" y="20" width="52" height="18" rx="4" fill="oklch(28% 0.02 30)"/>
  <path d="M100 30 L100 190" stroke="oklch(40% 0.02 60)" stroke-width="4"/>
  <path d="M100 30 l-8 22 h16 z" fill="oklch(75% 0.02 60)"/>
</svg>`;

export const TARTS_SVG = `
<svg viewBox="0 0 260 140" focusable="false">
  <rect x="10" y="80" width="240" height="14" rx="4" fill="oklch(52% 0.08 60)"/>
  <rect x="30" y="94" width="14" height="46" fill="oklch(46% 0.08 60)"/>
  <rect x="216" y="94" width="14" height="46" fill="oklch(46% 0.08 60)"/>
  <ellipse cx="130" cy="78" rx="96" ry="14" fill="oklch(96% 0.01 80)"/>
  ${[60, 100, 140, 180, 200, 80, 120, 160]
    .map(
      (x, i) =>
        `<g transform="translate(${x} ${i < 5 ? 66 : 54})"><ellipse cx="0" cy="0" rx="18" ry="9" fill="oklch(78% 0.1 70)"/><ellipse cx="0" cy="-3" rx="11" ry="6" fill="oklch(58% 0.22 25)"/></g>`,
    )
    .join('')}
</svg>`;

/** Twelve jurors: birds and beasts, as the book says, each a different shape. */
export const JURY_SVG = `
<svg viewBox="0 0 480 220" focusable="false">
  <rect x="0" y="120" width="480" height="100" fill="oklch(46% 0.08 60)"/>
  <rect x="0" y="112" width="480" height="12" fill="oklch(56% 0.08 60)"/>
  ${Array.from({ length: 12 }, (_, i) => {
    const x = 22 + i * 39;
    const y = i % 2 === 0 ? 70 : 92;
    const hue = 40 + i * 25;
    const ears =
      i % 3 === 0
        ? `<path d="M${x - 12} ${y - 12} l-4 -22 l14 12 z M${x + 12} ${y - 12} l4 -22 l-14 12 z" fill="oklch(50% 0.08 ${hue})"/>`
        : i % 3 === 1
          ? `<path d="M${x - 14} ${y - 8} l-10 -16 M${x + 14} ${y - 8} l10 -16" stroke="oklch(50% 0.08 ${hue})" stroke-width="4" stroke-linecap="round"/>`
          : `<path d="M${x} ${y - 16} l-6 -18 l12 0 z" fill="oklch(70% 0.14 ${hue})"/>`;
    return `${ears}<circle cx="${x}" cy="${y}" r="16" fill="oklch(62% 0.08 ${hue})"/><circle cx="${x - 5}" cy="${y - 2}" r="2" fill="oklch(20% 0 0)"/><circle cx="${x + 5}" cy="${y - 2}" r="2" fill="oklch(20% 0 0)"/><rect x="${x - 10}" y="${y + 20}" width="20" height="26" rx="3" fill="oklch(90% 0.02 80)"/>`;
  }).join('')}
</svg>`;

export const ALICE_SILHOUETTE_SVG = `
<svg viewBox="0 0 120 220" focusable="false">
  <path d="M44 86 C30 100 22 150 20 200 L100 200 C98 150 90 100 76 86 Z" fill="currentColor"/>
  <circle cx="60" cy="50" r="30" fill="currentColor"/>
  <path d="M30 60 C22 90 28 120 32 130 L40 92 Z M90 60 C98 90 92 120 88 130 L80 92 Z" fill="currentColor"/>
  <path d="M44 86 L14 120 M76 86 L106 118" stroke="currentColor" stroke-width="10" stroke-linecap="round"/>
</svg>`;

export const SISTER_SVG = `
<svg viewBox="0 0 300 200" focusable="false">
  <path d="M0 200 Q60 150 140 160 Q220 170 300 140 L300 200 Z" fill="oklch(40% 0.08 130)"/>
  <ellipse cx="150" cy="180" rx="120" ry="24" fill="oklch(46% 0.08 125)"/>
  <path d="M130 170 C118 130 128 96 150 90 C172 96 182 130 170 170 Z" fill="oklch(60% 0.1 300)"/>
  <circle cx="150" cy="76" r="22" fill="oklch(85% 0.05 60)"/>
  <path d="M128 78 Q150 40 172 78 Q170 62 150 60 Q130 62 128 78 Z" fill="oklch(60% 0.1 60)"/>
  <rect x="80" y="130" width="80" height="60" rx="6" fill="oklch(92% 0.03 85)" transform="rotate(-8 120 160)"/>
</svg>`;
