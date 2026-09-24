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
    return `${ears}<circle cx="${x}" cy="${y}" r="16" fill="oklch(62% 0.08 ${hue})"/><circle cx="${x - 5}" cy="${y - 2}" r="2" fill="oklch(20% 0 0)"/><circle cx="${x + 5}" cy="${y - 2}" r="2" fill="oklch(20% 0 0)"/><g class="tr__slate" data-juror="${i}"><rect x="${x - 10}" y="${y + 20}" width="20" height="26" rx="3" fill="oklch(90% 0.02 80)"/><path class="tr__scribble" d="M${x - 6} ${y + 27} h12 M${x - 6} ${y + 33} h9 M${x - 6} ${y + 39} h11" stroke="oklch(30% 0.02 60)" stroke-width="1.6" stroke-linecap="round" pathLength="1"/><path class="tr__mark tr__mark--yes" d="M${x - 5} ${y + 34} l4 4 l7 -9" stroke="oklch(45% 0.15 145)" stroke-width="2.2" fill="none" stroke-linecap="round" pathLength="1"/><path class="tr__mark tr__mark--no" d="M${x - 5} ${y + 27} l10 12 M${x + 5} ${y + 27} l-10 12" stroke="oklch(50% 0.2 25)" stroke-width="2.2" stroke-linecap="round" pathLength="1"/></g>`;
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

export const ALICE_LOOKING_DOWN_SVG = `
<svg viewBox="0 0 400 220" focusable="false">
  <ellipse cx="148" cy="60" rx="36" ry="17" fill="#1a1a1a"/>
  <ellipse cx="252" cy="60" rx="36" ry="17" fill="#1a1a1a"/>
  <path d="M0 220 L0 132 Q0 62 200 62 Q400 62 400 132 L400 220 Z" fill="var(--alice-dress)"/>
  <path d="M0 132 Q0 62 200 62 Q400 62 400 132" stroke="var(--alice-shadow)" stroke-width="7" fill="none" opacity="0.45"/>
  <path d="M68 220 L68 152 Q92 98 200 98 Q308 98 332 152 L332 220 Z" fill="var(--alice-apron)"/>
  <path d="M90 200 Q200 176 310 200" stroke="var(--alice-shadow)" stroke-width="5" fill="none" opacity="0.25"/>
</svg>`;

/** The Caterpillar on nothing: it sits on the mushroom the demo draws. */
export const CATERPILLAR_SVG = `
<svg viewBox="0 0 240 200" focusable="false">
  <g class="ct__body">
    <path d="M20 170 C40 120 70 120 90 150 C110 180 140 180 150 130 C158 92 190 80 200 60" stroke="var(--ct-cat)" stroke-width="34" fill="none" stroke-linecap="round"/>
    <path d="M20 170 C40 120 70 120 90 150 C110 180 140 180 150 130 C158 92 190 80 200 60" stroke="var(--ct-cat-stripe)" stroke-width="34" fill="none" stroke-linecap="round" stroke-dasharray="6 30"/>
    <path d="M40 176 v14 M70 160 v14 M110 176 v14 M140 160 v14" stroke="var(--ct-cat)" stroke-width="8" stroke-linecap="round"/>
  </g>
  <g class="ct__head">
    <circle cx="204" cy="48" r="30" fill="var(--ct-cat)"/>
    <circle cx="214" cy="40" r="5" fill="#222"/>
    <path d="M196 62 q10 8 22 0" stroke="#222" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M186 22 l-10 -18 M212 16 l4 -16" stroke="var(--ct-cat)" stroke-width="5" stroke-linecap="round"/>
    <path d="M226 58 q26 6 30 40" stroke="oklch(50% 0.06 60)" stroke-width="6" fill="none"/>
  </g>
  <path d="M250 98 q-6 30 0 60 v40 h20 v-40 q6 -30 0 -60 Z" fill="oklch(62% 0.12 60)" transform="translate(-12 -6)"/>
</svg>`;

export const MUSHROOM_SVG = `
<svg viewBox="0 0 400 320" focusable="false">
  <path d="M150 320 L160 170 L240 170 L250 320 Z" fill="oklch(90% 0.03 80)"/>
  <path d="M160 200 q40 -14 80 0" stroke="oklch(80% 0.04 80)" stroke-width="6" fill="none"/>
  <ellipse cx="200" cy="150" rx="200" ry="70" fill="var(--ct-mushroom)"/>
  <path d="M0 150 Q200 -60 400 150 Z" fill="var(--ct-mushroom)"/>
  <ellipse cx="200" cy="150" rx="200" ry="70" fill="oklch(0% 0 0 / 0.12)"/>
  <ellipse cx="120" cy="70" rx="26" ry="14" fill="var(--ct-mushroom-spot)"/>
  <ellipse cx="240" cy="40" rx="20" ry="11" fill="var(--ct-mushroom-spot)"/>
  <ellipse cx="320" cy="100" rx="24" ry="12" fill="var(--ct-mushroom-spot)"/>
  <ellipse cx="60" cy="126" rx="16" ry="8" fill="var(--ct-mushroom-spot)"/>
</svg>`;

/** A pigeon at the reader's face: wings on their own groups so they can beat. */
export const PIGEON_SVG = `
<svg viewBox="0 0 260 200" focusable="false">
  <g class="ct__wing ct__wing--left">
    <path d="M110 110 C60 60 20 60 0 90 C40 90 70 110 110 130 Z" fill="var(--ct-pigeon-wing)"/>
  </g>
  <g class="ct__wing ct__wing--right">
    <path d="M150 110 C200 60 240 60 260 90 C220 90 190 110 150 130 Z" fill="var(--ct-pigeon-wing)"/>
  </g>
  <ellipse cx="130" cy="130" rx="46" ry="34" fill="var(--ct-pigeon)"/>
  <circle cx="130" cy="86" r="26" fill="var(--ct-pigeon)"/>
  <circle cx="118" cy="80" r="5" fill="#fff"/><circle cx="118" cy="80" r="2.5" fill="#222"/>
  <circle cx="142" cy="80" r="5" fill="#fff"/><circle cx="142" cy="80" r="2.5" fill="#222"/>
  <path d="M122 96 l8 14 l8 -14 Z" fill="oklch(70% 0.14 60)"/>
  <path d="M112 160 v18 M148 160 v18" stroke="oklch(70% 0.14 60)" stroke-width="5" stroke-linecap="round"/>
</svg>`;

/** Alice's shoulders and dress seen from far above, at the foot of a long neck. */
export const ALICE_FROM_ABOVE_INNER = `
  <ellipse cx="60" cy="66" rx="52" ry="40" fill="var(--alice-dress)"/>
  <ellipse cx="60" cy="66" rx="30" ry="24" fill="var(--alice-apron)"/>
  <path d="M14 60 q-12 20 -4 36 M106 60 q12 20 4 36" stroke="var(--alice-skin)" stroke-width="8" fill="none" stroke-linecap="round"/>
  <ellipse cx="60" cy="52" rx="14" ry="9" fill="var(--alice-skin)"/>`;

export const ALICE_FROM_ABOVE_SVG = `
<svg viewBox="0 0 120 120" focusable="false">${ALICE_FROM_ABOVE_INNER}
</svg>`;

/** A gardener: a spade card with a paint brush; the pips say which one it is. */
export function gardenerSvg(pips: number): string {
  const spots = Array.from(
    { length: pips },
    (_, i) =>
      `<path d="M${44 + (i % 2) * 32} ${110 + Math.floor(i / 2) * 26} l7 -10 l7 10 q0 8 -7 6 q-7 2 -7 -6 z" fill="oklch(28% 0.02 30)"/>`,
  ).join('');
  return `
<svg viewBox="0 0 120 220" focusable="false">
  <rect x="30" y="80" width="60" height="130" rx="5" fill="oklch(94% 0.02 80)" stroke="oklch(30% 0.02 30)" stroke-width="3"/>
  ${spots}
  <circle cx="60" cy="56" r="22" fill="oklch(90% 0.05 60)"/>
  <path d="M44 40 q16 -18 32 0" stroke="oklch(50% 0.06 60)" stroke-width="6" fill="none" stroke-linecap="round"/>
  <g class="cq__brush">
    <path d="M96 100 L112 60" stroke="oklch(50% 0.06 60)" stroke-width="5" stroke-linecap="round"/>
    <path d="M108 66 l12 -12 l6 6 l-12 12 z" fill="var(--cq-red)"/>
  </g>
</svg>`;
}

/** A soldier doubled up on hands and feet: an arch on the croquet-ground. */
export const CARD_ARCH_SVG = `
<svg viewBox="0 0 200 140" focusable="false">
  <path d="M10 136 L10 90 Q10 20 100 20 Q190 20 190 90 L190 136 L150 136 L150 96 Q150 60 100 60 Q50 60 50 96 L50 136 Z" fill="oklch(94% 0.02 80)" stroke="oklch(30% 0.02 30)" stroke-width="3"/>
  <path d="M100 48 l10 -14 l-10 -14 l-10 14 z" fill="oklch(28% 0.02 30)"/>
  <circle cx="176" cy="126" r="14" fill="oklch(90% 0.05 60)"/>
  <path d="M6 136 h188" stroke="oklch(30% 0.02 30)" stroke-width="3"/>
</svg>`;

/** A hedgehog: rolled up as a ball, or unrolled and walking off. */
export const HEDGEHOG_SVG = `
<svg viewBox="0 0 140 110" focusable="false">
  <g class="cq__hedgehog-ball">
    <circle cx="70" cy="60" r="44" fill="oklch(40% 0.06 60)"/>
    <path d="M40 30 l-8 -14 M60 20 l-2 -16 M84 20 l6 -16 M104 34 l12 -12 M112 60 l16 -2 M30 60 l-16 2 M36 88 l-12 10 M108 88 l12 10" stroke="oklch(30% 0.05 60)" stroke-width="5" stroke-linecap="round"/>
  </g>
  <g class="cq__hedgehog-walk">
    <ellipse cx="66" cy="66" rx="52" ry="30" fill="oklch(40% 0.06 60)"/>
    <path d="M30 44 l-8 -16 M50 38 l-4 -18 M72 36 l0 -18 M94 40 l6 -18 M110 50 l12 -12" stroke="oklch(30% 0.05 60)" stroke-width="5" stroke-linecap="round"/>
    <path d="M114 70 q22 -4 22 10 q-10 6 -22 0 z" fill="oklch(72% 0.08 60)"/>
    <circle cx="120" cy="70" r="3" fill="#222"/>
    <circle cx="134" cy="80" r="4" fill="#222"/>
    <path d="M40 94 v12 M64 96 v12 M90 96 v12" stroke="oklch(30% 0.05 60)" stroke-width="6" stroke-linecap="round"/>
  </g>
</svg>`;

/** A flamingo held under the arm as a mallet, its neck rising into the frame. */
export const FLAMINGO_SVG = `
<svg viewBox="0 0 300 420" focusable="false">
  <path d="M60 420 L60 320 Q80 230 180 250 L180 420 Z" fill="var(--alice-dress)"/>
  <path d="M170 420 Q160 320 230 300 L260 300 L260 420 Z" fill="var(--alice-skin)"/>
  <g class="cq__flamingo-body">
    <ellipse cx="170" cy="300" rx="90" ry="46" fill="var(--cq-flamingo)"/>
    <path d="M90 310 q-30 20 -20 50 M110 330 q-20 30 0 60" stroke="var(--cq-flamingo)" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M230 280 q20 -60 -10 -120 q-20 -50 -60 -60" stroke="var(--cq-flamingo)" stroke-width="26" fill="none" stroke-linecap="round"/>
  </g>
  <g class="cq__flamingo-head">
    <circle cx="160" cy="100" r="30" fill="var(--cq-flamingo)"/>
    <path d="M138 108 L96 132 L140 122 Z" fill="oklch(30% 0.02 30)"/>
    <circle class="cq__flamingo-eye" cx="166" cy="92" r="6" fill="#fff"/>
    <circle class="cq__flamingo-eye" cx="167" cy="92" r="3" fill="#222"/>
  </g>
</svg>`;

/** The Cheshire Cat's head alone, in parts that can appear one after another. */
export const CAT_HEAD_SVG = `
<svg viewBox="0 0 240 200" focusable="false">
  <g class="cq__cat-ears">
    <path d="M60 90 L40 20 L100 62 Z M180 90 L200 20 L140 62 Z" fill="var(--cc-cat, oklch(62% 0.1 300))"/>
    <path d="M64 84 L54 40 L90 66 Z M176 84 L186 40 L150 66 Z" fill="var(--cc-cat-stripe, oklch(48% 0.1 300))"/>
  </g>
  <g class="cq__cat-face">
    <circle cx="120" cy="110" r="76" fill="var(--cc-cat, oklch(62% 0.1 300))"/>
    <path d="M70 80 q-6 14 6 22 M170 80 q6 14 -6 22 M54 120 q10 10 24 6 M186 120 q-10 10 -24 6" stroke="var(--cc-cat-stripe, oklch(48% 0.1 300))" stroke-width="8" fill="none" stroke-linecap="round"/>
  </g>
  <g class="cq__cat-eyes">
    <ellipse cx="92" cy="100" rx="14" ry="18" fill="oklch(90% 0.15 110)"/>
    <ellipse cx="148" cy="100" rx="14" ry="18" fill="oklch(90% 0.15 110)"/>
    <g class="cq__cat-pupils">
      <ellipse cx="92" cy="100" rx="4" ry="14" fill="#222"/>
      <ellipse cx="148" cy="100" rx="4" ry="14" fill="#222"/>
    </g>
  </g>
  <g class="cq__cat-grin">
    <path d="M56 136 Q120 196 184 136" stroke="var(--cc-grin, oklch(96% 0.02 90))" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M72 146 v10 M96 160 v12 M120 166 v13 M144 160 v12 M168 146 v10" stroke="var(--cc-grin, oklch(96% 0.02 90))" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`;

/** The rose-tree by the garden entrance: a bush; the roses on it are the demo's own. */
export const ROSE_TREE_SVG = `
<svg viewBox="0 0 320 360" focusable="false">
  <path d="M150 360 L150 250 Q150 200 170 190 L170 360 Z" fill="oklch(40% 0.08 60)"/>
  <ellipse cx="160" cy="170" rx="150" ry="120" fill="oklch(46% 0.12 140)"/>
  <ellipse cx="110" cy="130" rx="70" ry="60" fill="oklch(52% 0.13 135)"/>
  <ellipse cx="220" cy="150" rx="80" ry="70" fill="oklch(50% 0.13 145)"/>
  <ellipse cx="160" cy="230" rx="110" ry="60" fill="oklch(42% 0.11 140)"/>
</svg>`;

/** The Gryphon: eagle in front, lion behind, and given to bounding into the air. */
export const GRYPHON_SVG = `
<svg viewBox="0 0 240 220" focusable="false">
  <path d="M60 200 Q30 150 70 110 Q120 80 190 110 Q220 130 214 200 Z" fill="var(--lq-gryphon)"/>
  <path d="M40 130 Q0 100 30 60 Q60 40 100 80 Q70 90 60 120 Z" fill="var(--lq-gryphon-wing)"/>
  <path d="M60 200 v18 M100 204 v14 M170 204 v14 M206 200 v18" stroke="var(--lq-gryphon)" stroke-width="10" stroke-linecap="round"/>
  <path d="M214 170 q30 -10 20 -40" stroke="var(--lq-gryphon)" stroke-width="10" fill="none" stroke-linecap="round"/>
  <circle cx="160" cy="70" r="36" fill="var(--lq-gryphon-wing)"/>
  <path d="M192 74 l36 10 l-36 12 z" fill="oklch(78% 0.14 70)"/>
  <circle cx="170" cy="62" r="5" fill="#222"/>
  <path d="M140 40 q20 -30 46 -8" stroke="var(--lq-gryphon-wing)" stroke-width="8" fill="none" stroke-linecap="round"/>
</svg>`;

/** The Mock Turtle: a turtle with a calf's head, always about to cry. */
export const MOCK_TURTLE_SVG = `
<svg viewBox="0 0 240 220" focusable="false">
  <ellipse cx="120" cy="140" rx="96" ry="60" fill="var(--lq-turtle-shell)"/>
  <path d="M60 120 q60 -40 120 0 M50 150 q70 -30 140 0" stroke="oklch(0% 0 0 / 0.15)" stroke-width="8" fill="none"/>
  <path d="M40 180 l-16 24 M90 196 l-6 22 M150 196 l6 22 M200 180 l16 24" stroke="var(--lq-turtle)" stroke-width="12" stroke-linecap="round"/>
  <circle cx="120" cy="66" r="40" fill="var(--lq-turtle)"/>
  <ellipse cx="120" cy="82" rx="26" ry="16" fill="oklch(80% 0.05 60)"/>
  <circle cx="112" cy="84" r="3" fill="#222"/><circle cx="128" cy="84" r="3" fill="#222"/>
  <circle cx="106" cy="60" r="6" fill="#222"/><circle cx="134" cy="60" r="6" fill="#222"/>
  <path d="M84 40 l-14 -18 M156 40 l14 -18" stroke="var(--lq-turtle)" stroke-width="10" stroke-linecap="round"/>
  <path class="lq__tear" d="M104 68 q-6 14 0 20 q6 -6 0 -20 z" fill="oklch(85% 0.06 230)"/>
  <path class="lq__tear" d="M136 68 q6 14 0 20 q-6 -6 0 -20 z" fill="oklch(85% 0.06 230)"/>
</svg>`;

/** A lobster, to be carried as a partner and thrown as far out to sea as you can. */
export const LOBSTER_SVG = `
<svg viewBox="0 0 160 120" focusable="false">
  <ellipse cx="80" cy="70" rx="50" ry="26" fill="var(--lq-lobster)"/>
  <path d="M40 60 l-24 -24 M46 78 l-30 6 M120 60 l24 -24 M114 78 l30 6" stroke="var(--lq-lobster)" stroke-width="8" stroke-linecap="round"/>
  <path d="M8 26 q-8 14 8 16 q10 -6 4 -18 z M152 26 q8 14 -8 16 q-10 -6 -4 -18 z" fill="var(--lq-lobster)"/>
  <path d="M80 44 l-10 -30 M84 44 l14 -28" stroke="var(--lq-lobster)" stroke-width="4" stroke-linecap="round"/>
  <path d="M60 96 q20 20 40 0" fill="var(--lq-lobster)"/>
  <circle cx="66" cy="52" r="3" fill="#222"/><circle cx="94" cy="52" r="3" fill="#222"/>
</svg>`;

export type DancerKind = 'seal' | 'turtle' | 'salmon' | 'whiting' | 'snail' | 'porpoise';
export const DANCERS: readonly DancerKind[] = [
  'seal',
  'turtle',
  'salmon',
  'whiting',
  'snail',
  'porpoise',
];

/** The dancers on the shore, each a simple shape with a face turned to the camera. */
export function dancerSvg(kind: DancerKind): string {
  let inner = '';
  switch (kind) {
    case 'seal':
      inner =
        '<path d="M30 110 Q20 40 70 30 Q120 40 110 110 Z" fill="oklch(50% 0.03 250)"/><circle cx="70" cy="38" r="22" fill="oklch(56% 0.03 250)"/><circle cx="62" cy="34" r="3" fill="#222"/><circle cx="78" cy="34" r="3" fill="#222"/><path d="M40 110 l-16 10 M100 110 l16 10" stroke="oklch(50% 0.03 250)" stroke-width="10" stroke-linecap="round"/>';
      break;
    case 'turtle':
      inner =
        '<ellipse cx="70" cy="80" rx="50" ry="34" fill="oklch(52% 0.1 140)"/><circle cx="70" cy="34" r="20" fill="oklch(60% 0.1 140)"/><circle cx="64" cy="30" r="3" fill="#222"/><circle cx="76" cy="30" r="3" fill="#222"/><path d="M30 106 l-10 14 M110 106 l10 14" stroke="oklch(52% 0.1 140)" stroke-width="10" stroke-linecap="round"/>';
      break;
    case 'salmon':
      inner =
        '<path d="M70 10 Q110 60 70 120 Q30 60 70 10 Z" fill="oklch(72% 0.14 30)"/><path d="M70 120 l-18 14 h36 z" fill="oklch(72% 0.14 30)"/><circle cx="62" cy="36" r="3" fill="#222"/><circle cx="78" cy="36" r="3" fill="#222"/>';
      break;
    case 'whiting':
      inner =
        '<path d="M70 10 Q104 60 70 120 Q36 60 70 10 Z" fill="oklch(84% 0.03 240)"/><path d="M70 120 q-24 -10 -10 -30" stroke="oklch(84% 0.03 240)" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="62" cy="40" r="3" fill="#222"/><circle cx="78" cy="40" r="3" fill="#222"/><path d="M60 62 q10 8 20 0" stroke="#222" stroke-width="2" fill="none"/>';
      break;
    case 'snail':
      inner =
        '<path d="M20 110 Q60 100 110 106 Q120 118 100 124 L24 124 Z" fill="oklch(70% 0.1 80)"/><circle cx="76" cy="76" r="34" fill="oklch(62% 0.12 50)"/><circle cx="76" cy="76" r="20" fill="oklch(70% 0.12 50)"/><circle cx="76" cy="76" r="8" fill="oklch(62% 0.12 50)"/><circle cx="30" cy="96" r="14" fill="oklch(70% 0.1 80)"/><path d="M24 84 l-6 -18 M36 84 l6 -18" stroke="oklch(70% 0.1 80)" stroke-width="4" stroke-linecap="round"/><circle cx="18" cy="64" r="3" fill="#222"/><circle cx="42" cy="64" r="3" fill="#222"/>';
      break;
    case 'porpoise':
      inner =
        '<path d="M20 90 Q60 20 130 70 Q110 110 60 108 Q30 106 20 90 Z" fill="oklch(56% 0.06 240)"/><path d="M70 50 l14 -26 l10 30 z" fill="oklch(56% 0.06 240)"/><path d="M20 90 l-14 -16 l4 30 z" fill="oklch(56% 0.06 240)"/><circle cx="112" cy="70" r="3" fill="#222"/>';
      break;
  }
  return `<svg viewBox="0 0 140 140" focusable="false">${inner}</svg>`;
}

/** Bill in a 0..120 by 0..100 box, drawn once, for HTML and for other SVGs. */
export const BILL_FRAGMENT = `  <path d="M10 70 Q40 30 80 50 Q110 66 100 84 Q60 96 20 84 Z" fill="var(--bl-lizard, oklch(66% 0.12 130))"/>
  <circle cx="92" cy="46" r="16" fill="var(--bl-lizard, oklch(66% 0.12 130))"/>
  <circle cx="98" cy="42" r="4" fill="#fff"/><circle cx="99" cy="42" r="2" fill="#222"/>
  <path d="M10 70 Q-10 60 4 40" stroke="var(--bl-lizard, oklch(66% 0.12 130))" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M30 84 l-6 12 M60 90 l0 10 M84 84 l6 12" stroke="var(--bl-lizard, oklch(66% 0.12 130))" stroke-width="6" stroke-linecap="round"/>`;

export const BILL_SVG = `
<svg viewBox="0 0 120 100" focusable="false">
  ${BILL_FRAGMENT}
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
export const HOUSE_RABBIT = `<ellipse cx="0" cy="-22" rx="24" ry="16" fill="var(--hs-rabbit, oklch(96% 0.01 90))"/>
      <circle cx="22" cy="-40" r="12" fill="var(--hs-rabbit, oklch(96% 0.01 90))"/>
      <path d="M18 -50 L14 -78 L24 -52 M28 -50 L34 -78 L30 -52" fill="var(--hs-rabbit, oklch(96% 0.01 90))"/>
      <rect x="-10" y="-34" width="16" height="14" rx="3" fill="oklch(52% 0.18 25)"/>
      <circle cx="26" cy="-42" r="2.4" fill="oklch(70% 0.2 20)"/>`;

/** Pat, the Rabbit's gardener, with his spade: feet at the origin, a 60 by 70 box. */
export const HOUSE_PAT = `<ellipse cx="0" cy="-20" rx="20" ry="18" fill="oklch(58% 0.08 60)"/>
      <circle cx="-2" cy="-44" r="12" fill="oklch(74% 0.08 60)"/>
      <path d="M-14 -50 h24 l-4 -8 h-16 z" fill="oklch(44% 0.06 60)"/>
      <circle cx="3" cy="-46" r="2" fill="#222"/>
      <path d="M22 -2 L26 -48" stroke="var(--hs-timber, oklch(40% 0.06 50))" stroke-width="4" stroke-linecap="round"/>
      <path d="M18 -58 h16 v12 h-16 z" fill="oklch(50% 0.02 240)"/>`;
