/** Pig and Pepper's own props: the little house, the tree, the hearth and the
    cauldron, the crockery the cook throws, and Alice's own two hands. */

const SKIN_HAND =
  '<svg viewBox="0 0 120 160" focusable="false"><path d="M20 160 L20 80 Q30 40 60 46 Q90 40 100 80 L100 160 Z" fill="var(--alice-skin)"/><path d="M34 84 v-30 M54 78 v-40 M74 78 v-40 M94 90 v-26" stroke="var(--alice-skin)" stroke-width="14" stroke-linecap="round"/></svg>';

/** Her two hands at the bottom of the frame, and the bundle between them. */
export const hands = (bundle: string): string =>
  `<div class="pp__hand pp__hand--left">${SKIN_HAND}</div>` +
  `<div class="pp__held">${bundle}</div>` +
  `<div class="pp__hand pp__hand--right">${SKIN_HAND}</div>`;

/** The house front at the wood's edge: a wall, a roof, a window, and a door
    whose leaf is its own element so it can swing open. */
export const HOUSE_SVG = `
<svg viewBox="0 0 320 300" focusable="false">
  <path d="M10 120 L160 20 L310 120 Z" fill="var(--pp-roof)"/>
  <rect x="34" y="120" width="252" height="180" fill="var(--pp-wall)"/>
  <path d="M34 120 h252" stroke="var(--pp-roof)" stroke-width="10"/>
  <rect x="220" y="150" width="44" height="44" fill="var(--pp-window)"/>
  <path d="M242 150 v44 M220 172 h44" stroke="var(--pp-roof)" stroke-width="4"/>
  <rect x="60" y="150" width="44" height="44" fill="var(--pp-window)"/>
  <path d="M82 150 v44 M60 172 h44" stroke="var(--pp-roof)" stroke-width="4"/>
  <rect x="120" y="164" width="80" height="136" fill="var(--pp-dark)"/>
</svg>`;

export const DOOR_LEAF_SVG = `
<svg viewBox="0 0 80 136" focusable="false">
  <rect x="0" y="0" width="80" height="136" fill="var(--pp-door)"/>
  <rect x="10" y="12" width="60" height="50" fill="none" stroke="var(--pp-roof)" stroke-width="4"/>
  <rect x="10" y="74" width="60" height="50" fill="none" stroke="var(--pp-roof)" stroke-width="4"/>
  <circle cx="66" cy="70" r="5" fill="var(--pp-brass)"/>
</svg>`;

export const TREE_SVG = `
<svg viewBox="0 0 200 320" focusable="false">
  <path d="M90 320 L88 150 Q100 130 112 150 L110 320 Z" fill="var(--pp-trunk)"/>
  <path d="M100 160 L60 110 M100 180 L146 120" stroke="var(--pp-trunk)" stroke-width="14" stroke-linecap="round"/>
  <ellipse cx="100" cy="100" rx="90" ry="80" fill="var(--pp-leaf)"/>
  <ellipse cx="60" cy="130" rx="50" ry="40" fill="var(--pp-leaf-deep)"/>
  <ellipse cx="150" cy="120" rx="46" ry="38" fill="var(--pp-leaf-deep)"/>
</svg>`;

/** The hearth: a stone arch with the fire in it, the cauldron hung above. */
export const HEARTH_SVG = `
<svg viewBox="0 0 400 300" focusable="false">
  <path d="M20 300 L20 90 Q200 -10 380 90 L380 300 Z" fill="var(--pp-stone)"/>
  <path d="M60 300 L60 120 Q200 40 340 120 L340 300 Z" fill="var(--pp-soot)"/>
  <path d="M20 90 Q200 -10 380 90" stroke="var(--pp-stone-deep)" stroke-width="12" fill="none"/>
  <g class="pp__fire">
    <path d="M120 300 Q110 220 160 200 Q150 250 190 240 Q180 180 230 170 Q240 230 270 220 Q290 260 280 300 Z" fill="var(--pp-fire)"/>
    <path d="M160 300 Q150 250 190 240 Q200 270 230 250 Q240 280 250 300 Z" fill="var(--pp-fire-hot)"/>
  </g>
  <path d="M100 300 h200" stroke="var(--pp-stone-deep)" stroke-width="10"/>
</svg>`;

export const CAULDRON_SVG = `
<svg viewBox="0 0 240 200" focusable="false">
  <path d="M120 30 L60 8 M120 30 L180 8" stroke="var(--pp-iron)" stroke-width="6" stroke-linecap="round"/>
  <path d="M40 70 Q40 190 120 190 Q200 190 200 70 Z" fill="var(--pp-iron)"/>
  <ellipse cx="120" cy="70" rx="80" ry="18" fill="var(--pp-iron-rim)"/>
  <ellipse cx="120" cy="68" rx="66" ry="11" fill="var(--pp-soup)"/>
  <path d="M30 76 q-14 4 -8 18 M210 76 q14 4 8 18" stroke="var(--pp-iron)" stroke-width="8" fill="none" stroke-linecap="round"/>
  <g class="pp__steam">
    <path d="M86 54 q-10 -18 0 -34 M120 50 q-12 -20 0 -40 M154 54 q-10 -18 0 -34" stroke="var(--pp-steam)" stroke-width="6" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;

/** What the cook throws: each a small drawing of its own. */
export const THINGS: Record<string, string> = {
  saucepan:
    '<svg viewBox="0 0 120 80" focusable="false"><path d="M10 30 h70 v40 q0 6 -6 6 h-58 q-6 0 -6 -6 z" fill="var(--pp-iron)"/><ellipse cx="45" cy="30" rx="35" ry="8" fill="var(--pp-iron-rim)"/><path d="M80 34 h34" stroke="var(--pp-iron)" stroke-width="8" stroke-linecap="round"/></svg>',
  plate:
    '<svg viewBox="0 0 100 100" focusable="false"><circle cx="50" cy="50" r="46" fill="var(--pp-china)"/><circle cx="50" cy="50" r="30" fill="none" stroke="var(--pp-china-rim)" stroke-width="4"/><circle cx="50" cy="50" r="42" fill="none" stroke="var(--pp-china-rim)" stroke-width="2"/></svg>',
  dish: '<svg viewBox="0 0 120 70" focusable="false"><ellipse cx="60" cy="40" rx="56" ry="24" fill="var(--pp-china)"/><ellipse cx="60" cy="36" rx="40" ry="14" fill="none" stroke="var(--pp-china-rim)" stroke-width="3"/></svg>',
  'fire-iron':
    '<svg viewBox="0 0 140 40" focusable="false"><path d="M6 20 h116" stroke="var(--pp-iron)" stroke-width="8" stroke-linecap="round"/><path d="M122 20 l12 -12 M122 20 l12 12" stroke="var(--pp-iron)" stroke-width="6" stroke-linecap="round"/><circle cx="8" cy="20" r="8" fill="var(--pp-iron-rim)"/></svg>',
  'frying-pan':
    '<svg viewBox="0 0 140 80" focusable="false"><ellipse cx="50" cy="44" rx="44" ry="30" fill="var(--pp-iron)"/><ellipse cx="50" cy="40" rx="34" ry="20" fill="var(--pp-iron-rim)"/><path d="M92 40 h44" stroke="var(--pp-iron)" stroke-width="9" stroke-linecap="round"/></svg>',
};
