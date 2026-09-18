/**
 * Every character drawn in code, in one place, so the registry can hand them out
 * and a generated cut-out can take a slot without a demo changing. Props (bottles,
 * cakes, tables) stay with their demos: they are scenery, not characters.
 */
const crown = (x: number, y: number, fill: string): string =>
  `<path d="M${x - 26} ${y} l6 -26 l12 14 l8 -22 l8 22 l12 -14 l6 26 z" fill="${fill}"/>`;

export const ALICE_SVG = `
<svg class="rh__alice-figure" viewBox="0 0 120 200" focusable="false">
  <g class="rh__hair">
    <path d="M32 44 C22 60 20 90 30 104 L44 96 L40 60 Z" fill="var(--alice-hair-deep)"/>
    <path d="M88 44 C98 60 100 90 90 104 L76 96 L80 60 Z" fill="var(--alice-hair-deep)"/>
    <ellipse cx="60" cy="38" rx="30" ry="24" fill="var(--alice-hair)"/>
  </g>
  <ellipse cx="60" cy="46" rx="22" ry="24" fill="var(--alice-skin)"/>
  <path d="M38 40 C42 22 78 22 82 40 C74 34 46 34 38 40 Z" fill="var(--alice-hair)"/>
  <rect x="34" y="26" width="52" height="5" rx="2.5" fill="var(--alice-band)"/>
  <circle cx="51" cy="48" r="2.4" fill="#2a2a2a"/>
  <circle cx="69" cy="48" r="2.4" fill="#2a2a2a"/>
  <path d="M54 58 Q60 63 66 58" stroke="#b05a5a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <g class="rh__skirt">
    <path d="M40 74 C28 90 22 130 20 156 L100 156 C98 130 92 90 80 74 Z" fill="var(--alice-dress)"/>
    <path d="M48 76 C42 100 40 130 40 150 L80 150 C80 130 78 100 72 76 Z" fill="var(--alice-apron)"/>
    <path d="M40 74 L80 74 L76 96 L44 96 Z" fill="var(--alice-dress)"/>
  </g>
  <path d="M40 74 L18 110" stroke="var(--alice-skin)" stroke-width="8" stroke-linecap="round"/>
  <path d="M80 74 L104 106" stroke="var(--alice-skin)" stroke-width="8" stroke-linecap="round"/>
  <path d="M44 156 L40 188" stroke="var(--alice-apron)" stroke-width="9" stroke-linecap="round"/>
  <path d="M76 156 L80 188" stroke="var(--alice-apron)" stroke-width="9" stroke-linecap="round"/>
  <ellipse cx="39" cy="192" rx="9" ry="5" fill="#1a1a1a"/>
  <ellipse cx="81" cy="192" rx="9" ry="5" fill="#1a1a1a"/>
</svg>`;

export const DINAH_SVG = `
<svg viewBox="0 0 120 100" focusable="false">
  <path d="M20 90 C10 70 12 44 30 34 L36 14 L50 30 L70 30 L84 14 L90 34 C108 44 110 70 100 90 Z" fill="currentColor"/>
  <path d="M100 80 C118 74 118 50 104 46" stroke="currentColor" stroke-width="8" fill="none" stroke-linecap="round"/>
  <circle cx="48" cy="52" r="4" fill="#d9f0ff"/>
  <circle cx="72" cy="52" r="4" fill="#d9f0ff"/>
</svg>`;

export const RABBIT_SVG = `
<svg viewBox="0 0 120 100" focusable="false">
  <ellipse cx="62" cy="66" rx="34" ry="20" fill="currentColor"/>
  <circle cx="96" cy="50" r="14" fill="currentColor"/>
  <path d="M98 38 L104 6 L112 38 M90 38 L84 8 L96 36" fill="currentColor"/>
  <rect x="70" y="52" width="18" height="16" rx="4" fill="var(--alice-dress)"/>
  <circle cx="20" cy="70" r="7" fill="currentColor"/>
  <path d="M40 84 L30 96 M70 86 L78 98" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
  <circle cx="86" cy="64" r="5" fill="var(--alice-hair-deep)"/>
</svg>`;

export const BAT_SVG = `
<svg viewBox="0 0 100 50" focusable="false">
  <path class="rh__wing" d="M50 25 C40 5 20 0 2 12 C12 16 14 22 10 30 C22 24 36 26 50 36 Z" fill="currentColor"/>
  <path class="rh__wing rh__wing--right" d="M50 25 C60 5 80 0 98 12 C88 16 86 22 90 30 C78 24 64 26 50 36 Z" fill="currentColor"/>
  <ellipse cx="50" cy="27" rx="7" ry="11" fill="currentColor"/>
  <path d="M45 18 L43 8 L49 16 M55 18 L57 8 L51 16" fill="currentColor"/>
</svg>`;

export const MOUSE_SVG = `
<svg viewBox="0 0 140 110" focusable="false">
  <g class="dm__body">
    <ellipse cx="70" cy="74" rx="54" ry="32" fill="var(--dm-mouse)"/>
    <circle cx="112" cy="58" r="22" fill="var(--dm-mouse)"/>
    <circle cx="104" cy="38" r="9" fill="var(--dm-mouse)"/>
    <circle cx="104" cy="38" r="5" fill="oklch(78% 0.08 30)"/>
    <circle cx="126" cy="42" r="9" fill="var(--dm-mouse)"/>
    <circle cx="126" cy="42" r="5" fill="oklch(78% 0.08 30)"/>
    <circle cx="134" cy="62" r="4" fill="oklch(30% 0.05 30)"/>
    <path class="dm__eye-shut" d="M112 54 q6 4 12 0" stroke="oklch(30% 0.05 30)" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <circle class="dm__eye-open" cx="118" cy="54" r="4" fill="oklch(20% 0.02 30)"/>
    <path d="M18 80 C4 70 0 52 12 44" stroke="var(--dm-mouse)" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M128 66 l10 -2 M128 70 l10 2" stroke="oklch(30% 0.05 30)" stroke-width="1.4"/>
  </g>
  <text class="dm__zzz" x="112" y="24" font-size="16">z</text>
  <text class="dm__zzz dm__zzz--2" x="118" y="20" font-size="13">z</text>
  <text class="dm__zzz dm__zzz--3" x="124" y="16" font-size="10">z</text>
</svg>`;

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

export const FOOT_SVG = `
<svg viewBox="0 0 200 260" focusable="false">
  <path d="M70 260 L70 120 Q70 90 100 90 Q130 90 130 120 L130 260 Z" fill="var(--alice-apron)"/>
  <path d="M78 130 h44 M78 150 h44 M78 170 h44 M78 190 h44" stroke="var(--alice-dress)" stroke-width="6" opacity="0.6"/>
  <path d="M62 100 Q100 60 138 100 Q150 118 130 130 L70 130 Q50 118 62 100 Z" fill="#1a1a1a"/>
  <ellipse cx="100" cy="128" rx="44" ry="10" fill="#1a1a1a"/>
</svg>`;

export const BILL_SVG = `
<svg viewBox="0 0 120 100" focusable="false">
  <path d="M10 70 Q40 30 80 50 Q110 66 100 84 Q60 96 20 84 Z" fill="var(--bl-lizard)"/>
  <circle cx="92" cy="46" r="16" fill="var(--bl-lizard)"/>
  <circle cx="98" cy="42" r="4" fill="#fff"/><circle cx="99" cy="42" r="2" fill="#222"/>
  <path d="M10 70 Q-10 60 4 40" stroke="var(--bl-lizard)" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M30 84 l-6 12 M60 90 l0 10 M84 84 l6 12" stroke="var(--bl-lizard)" stroke-width="6" stroke-linecap="round"/>
</svg>`;

export const CROWD_SVG = `
<svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice" focusable="false">
  ${[40, 110, 300, 360]
    .map(
      (x, i) =>
        `<g transform="translate(${x} 100)"><ellipse cx="0" cy="0" rx="22" ry="14" fill="oklch(${62 + i * 6}% 0.06 60)"/><circle cx="18" cy="-12" r="10" fill="oklch(${62 + i * 6}% 0.06 60)"/><circle cx="22" cy="-14" r="1.8" fill="#222"/></g>`,
    )
    .join('')}
  <g transform="translate(200 100)"><rect x="-6" y="-46" width="12" height="40" rx="3" fill="oklch(60% 0.12 60)"/><rect x="-3" y="-54" width="6" height="10" fill="oklch(40% 0.05 60)"/></g>
</svg>`;

export const CAT_SVG = `
<svg viewBox="0 0 400 240" focusable="false">
  <defs>
    <linearGradient id="cc-fade" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#000"/>
      <stop offset="0.5" stop-color="#000"/>
      <stop offset="0.7" stop-color="#fff"/>
      <stop offset="1" stop-color="#fff"/>
    </linearGradient>
    <mask id="cc-mask" maskUnits="userSpaceOnUse" x="-1000" y="0" width="2000" height="240">
      <!-- A wide gradient the script slides along the body: white shows, black hides. -->
      <rect class="cc__mask-slide" x="-400" y="0" width="1200" height="240" fill="url(#cc-fade)"/>
    </mask>
  </defs>
  <!-- The bough -->
  <path d="M0 200 C80 180 140 190 220 176 C300 162 340 170 400 150" stroke="oklch(24% 0.05 60)" stroke-width="22" fill="none" stroke-linecap="round"/>
  <g class="cc__cat" mask="url(#cc-mask)">
    <g class="cc__tail">
      <path d="M130 150 C90 150 60 120 70 90 C76 70 100 66 110 84" stroke="var(--cc-cat)" stroke-width="18" fill="none" stroke-linecap="round"/>
      <path d="M96 128 l8 -14 M80 108 l14 -8" stroke="var(--cc-cat-stripe)" stroke-width="6" stroke-linecap="round"/>
    </g>
    <ellipse cx="210" cy="140" rx="90" ry="50" fill="var(--cc-cat)"/>
    <path d="M150 110 q20 20 0 50 M180 100 q22 24 0 60 M215 96 q24 26 0 66 M250 102 q20 24 0 58" stroke="var(--cc-cat-stripe)" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M170 190 l-4 18 M240 190 l6 18 M280 176 l14 12" stroke="var(--cc-cat)" stroke-width="14" stroke-linecap="round"/>
    <circle cx="300" cy="96" r="52" fill="var(--cc-cat)"/>
    <path d="M262 60 L252 12 L288 46 Z M338 60 L348 12 L312 46 Z" fill="var(--cc-cat)"/>
    <path d="M266 58 L262 30 L282 50 Z M334 58 L338 30 L318 50 Z" fill="var(--cc-cat-stripe)"/>
    <path d="M270 72 q-6 10 4 14 M330 72 q6 10 -4 14" stroke="var(--cc-cat-stripe)" stroke-width="8" fill="none" stroke-linecap="round"/>
    <ellipse cx="284" cy="88" rx="9" ry="12" fill="oklch(90% 0.15 110)"/>
    <ellipse cx="316" cy="88" rx="9" ry="12" fill="oklch(90% 0.15 110)"/>
    <g class="cc__pupils">
      <ellipse cx="284" cy="88" rx="3" ry="10" fill="#222"/>
      <ellipse cx="316" cy="88" rx="3" ry="10" fill="#222"/>
    </g>
  </g>
  <!-- The grin: outside the mask, so it stays when the rest has gone -->
  <g class="cc__grin">
    <path d="M256 116 Q300 156 344 116" stroke="var(--cc-grin)" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M266 122 v8 M282 132 v10 M300 136 v11 M318 132 v10 M334 122 v8" stroke="var(--cc-grin)" stroke-width="3.5" stroke-linecap="round"/>
  </g>
</svg>`;

export type RunnerKind =
  | 'dodo'
  | 'duck'
  | 'lory'
  | 'eaglet'
  | 'mouse'
  | 'alice'
  | 'crab'
  | 'magpie';

export const RUNNERS: readonly RunnerKind[] = [
  'dodo',
  'duck',
  'lory',
  'eaglet',
  'mouse',
  'alice',
  'crab',
  'magpie',
];

const bird = (body: string, head: string, beak: string, extra = ''): string =>
  `<ellipse cx="50" cy="78" rx="30" ry="22" fill="${body}"/>` +
  `<circle cx="72" cy="46" r="16" fill="${head}"/>` +
  `<path d="M84 44 l${beak === 'long' ? 30 : 16} 6 l-${beak === 'long' ? 30 : 16} 6 z" fill="oklch(78% 0.14 70)"/>` +
  '<circle cx="76" cy="42" r="2.5" fill="#222"/>' +
  `<path d="M38 98 v14 M58 98 v14" stroke="oklch(78% 0.14 70)" stroke-width="5" stroke-linecap="round"/>${extra}`;

export function runnerSvg(kind: RunnerKind): string {
  let inner = '';
  switch (kind) {
    case 'dodo':
      inner = bird(
        'oklch(70% 0.03 250)',
        'oklch(74% 0.03 250)',
        'long',
        '<path d="M22 70 q-14 10 -6 24" stroke="oklch(60% 0.03 250)" stroke-width="6" fill="none"/>',
      );
      break;
    case 'duck':
      inner = bird('oklch(90% 0.02 90)', 'oklch(52% 0.1 150)', 'short');
      break;
    case 'lory':
      inner = bird(
        'oklch(62% 0.2 30)',
        'oklch(62% 0.2 30)',
        'short',
        '<path d="M20 78 l-16 -14 M20 80 l-18 0" stroke="oklch(55% 0.18 250)" stroke-width="6" stroke-linecap="round"/>',
      );
      break;
    case 'eaglet':
      inner = bird('oklch(50% 0.06 60)', 'oklch(88% 0.02 80)', 'short');
      break;
    case 'magpie':
      inner = bird(
        'oklch(22% 0.02 260)',
        'oklch(22% 0.02 260)',
        'short',
        '<path d="M30 76 q-24 -4 -30 12" stroke="oklch(22% 0.02 260)" stroke-width="8" stroke-linecap="round"/><ellipse cx="46" cy="86" rx="12" ry="8" fill="oklch(96% 0 0)"/>',
      );
      break;
    case 'mouse':
      inner =
        '<ellipse cx="50" cy="82" rx="30" ry="18" fill="oklch(62% 0.05 60)"/>' +
        '<circle cx="76" cy="66" r="13" fill="oklch(62% 0.05 60)"/>' +
        '<circle cx="70" cy="52" r="6" fill="oklch(78% 0.08 30)"/><circle cx="84" cy="54" r="6" fill="oklch(78% 0.08 30)"/>' +
        '<circle cx="80" cy="66" r="2" fill="#222"/>' +
        '<path d="M22 84 q-20 -10 -16 -30" stroke="oklch(62% 0.05 60)" stroke-width="4" fill="none" stroke-linecap="round"/>';
      break;
    case 'alice':
      inner =
        '<path d="M34 60 C24 74 22 96 22 108 L78 108 C78 96 76 74 66 60 Z" fill="var(--alice-dress)"/>' +
        '<path d="M40 62 C36 80 36 96 36 104 L64 104 C64 96 64 80 60 62 Z" fill="var(--alice-apron)"/>' +
        '<circle cx="50" cy="38" r="18" fill="var(--alice-skin)"/>' +
        '<path d="M32 36 Q50 12 68 36 Q64 24 50 24 Q36 24 32 36 Z" fill="var(--alice-hair)"/>' +
        '<path d="M32 40 q-6 20 0 34 M68 40 q6 20 0 34" stroke="var(--alice-hair)" stroke-width="8" stroke-linecap="round" fill="none"/>' +
        '<circle cx="44" cy="40" r="2" fill="#222"/><circle cx="56" cy="40" r="2" fill="#222"/>';
      break;
    case 'crab':
      inner =
        '<ellipse cx="50" cy="84" rx="34" ry="18" fill="oklch(62% 0.2 30)"/>' +
        '<circle cx="38" cy="66" r="5" fill="#222"/><circle cx="62" cy="66" r="5" fill="#222"/>' +
        '<path d="M16 80 l-14 -18 M84 80 l14 -18" stroke="oklch(62% 0.2 30)" stroke-width="8" stroke-linecap="round"/>' +
        '<path d="M22 98 l-10 12 M36 102 l-6 12 M64 102 l6 12 M78 98 l10 12" stroke="oklch(62% 0.2 30)" stroke-width="5" stroke-linecap="round"/>';
      break;
  }
  return `<svg viewBox="0 0 100 116" focusable="false"><g class="cr__figure">${inner}</g></svg>`;
}

export const HOUSE_STANDING =
  '<path d="M-22 -60 C-34 -40 -36 -10 -36 0 L36 0 C36 -10 34 -40 22 -60 Z" fill="var(--alice-dress)"/>' +
  '<path d="M-14 -58 C-18 -40 -18 -14 -18 -4 L18 -4 C18 -14 18 -40 14 -58 Z" fill="var(--alice-apron)"/>' +
  '<circle cx="0" cy="-80" r="20" fill="var(--alice-skin)"/>' +
  '<path d="M-20 -84 Q0 -110 20 -84 Q16 -98 0 -98 Q-16 -98 -20 -84 Z" fill="var(--alice-hair)"/>' +
  '<path d="M-20 -80 q-8 22 -2 40 M20 -80 q8 22 2 40" stroke="var(--alice-hair)" stroke-width="9" stroke-linecap="round" fill="none"/>' +
  '<path d="M-22 -58 L-40 -30 M22 -58 L40 -30" stroke="var(--alice-skin)" stroke-width="8" stroke-linecap="round"/>' +
  '<circle cx="-7" cy="-78" r="2.2" fill="#222"/><circle cx="7" cy="-78" r="2.2" fill="#222"/>';

export const HOUSE_KNEELING =
  '<path d="M-90 0 L-70 -120 C-70 -150 20 -150 40 -120 L60 0 Z" fill="var(--alice-dress)"/>' +
  '<path d="M-60 0 L-46 -110 C-46 -128 6 -128 20 -110 L34 0 Z" fill="var(--alice-apron)"/>' +
  '<circle cx="-10" cy="-170" r="44" fill="var(--alice-skin)"/>' +
  '<path d="M-54 -176 Q-10 -232 34 -176 Q26 -206 -10 -206 Q-46 -206 -54 -176 Z" fill="var(--alice-hair)"/>' +
  '<path d="M-54 -170 q-18 46 -4 86 M34 -170 q18 46 4 86" stroke="var(--alice-hair)" stroke-width="18" stroke-linecap="round" fill="none"/>' +
  '<path d="M-60 -120 L-120 -40 M40 -120 L100 -60" stroke="var(--alice-skin)" stroke-width="16" stroke-linecap="round"/>' +
  '<circle cx="-24" cy="-166" r="5" fill="#222"/><circle cx="6" cy="-166" r="5" fill="#222"/>';

export const HOUSE_FILLING =
  '<path d="M-330 0 L-330 -150 C-330 -230 -120 -260 60 -230 L330 -160 L330 0 Z" fill="var(--alice-dress)"/>' +
  '<path d="M-260 0 L-260 -140 C-260 -190 -100 -210 40 -190 L120 -170 L120 0 Z" fill="var(--alice-apron)"/>' +
  '<circle cx="-250" cy="-240" r="70" fill="var(--alice-skin)"/>' +
  '<path d="M-320 -250 Q-250 -340 -180 -250 Q-195 -300 -250 -300 Q-305 -300 -320 -250 Z" fill="var(--alice-hair)"/>' +
  '<path d="M-320 -240 q-28 70 -8 130" stroke="var(--alice-hair)" stroke-width="30" stroke-linecap="round" fill="none"/>' +
  '<circle cx="-270" cy="-236" r="8" fill="#222"/><circle cx="-228" cy="-236" r="8" fill="#222"/>' +
  '<path d="M-262 -206 q12 8 24 0" stroke="#7a3a3a" stroke-width="4" fill="none" stroke-linecap="round"/>' +
  '<path d="M-200 -190 L-330 -120" stroke="var(--alice-skin)" stroke-width="28" stroke-linecap="round"/>' +
  '<path d="M260 -190 L330 -260 L330 -300" stroke="var(--alice-apron)" stroke-width="30" stroke-linecap="round" fill="none"/>' +
  '<circle cx="330" cy="-300" r="24" fill="#1a1a1a"/>';

/** The Rabbit as seen from the garden, a fragment in house units (52 wide, 80 tall, feet at 0,0). */
export const HOUSE_RABBIT = `<ellipse cx="0" cy="-22" rx="24" ry="16" fill="var(--hs-rabbit)"/>
      <circle cx="22" cy="-40" r="12" fill="var(--hs-rabbit)"/>
      <path d="M18 -50 L14 -78 L24 -52 M28 -50 L34 -78 L30 -52" fill="var(--hs-rabbit)"/>
      <rect x="-10" y="-34" width="16" height="14" rx="3" fill="oklch(52% 0.18 25)"/>
      <circle cx="26" cy="-42" r="2.4" fill="oklch(70% 0.2 20)"/>`;
