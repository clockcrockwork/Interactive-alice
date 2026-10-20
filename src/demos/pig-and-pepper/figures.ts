/** Pig and Pepper's own props: the little house, the tree, the hearth and the
    cauldron, the crockery the cook throws, and Alice's own two hands. */

import { figure } from '../art/art.ts';

/** Her two hands at the bottom of the frame, and the bundle between them. */
export const hands = (bundle: string): string =>
  `<div class="pp__hand pp__hand--left">${figure('alice/hand-left')}</div>` +
  `<div class="pp__held">${bundle}</div>` +
  `<div class="pp__hand pp__hand--right">${figure('alice/hand-right')}</div>`;

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

/** A line of writing as a scribble: no letters, only the hand's wave. */
const scribble = (y: number, x0: number, x1: number, wave = 3.2): string => {
  let d = `M${x0} ${y}`;
  for (let x = x0; x < x1 - 6; x += 12) {
    d += ` q3 ${-wave} 6 0 t6 0`;
  }
  return `<path d="${d}" stroke="var(--ink-secondary)" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
};

/** The Queen's invitation, folded in three: the middle third, and the two flaps
    that open up and down off it. Each third is 180 by 80; the outside of the top
    flap carries the seal, a heart, in the court's red. Scribbles, never lettering. */
export const LETTER = {
  top: `<svg viewBox="0 0 180 80" preserveAspectRatio="none" focusable="false">
  <rect x="1.5" y="1.5" width="177" height="78" fill="var(--paper-base)" stroke="var(--ink-faded)" stroke-width="3"/>
  <path d="M90 16 c-4 -6 -12 -2 -10 4 c1 4 6 7 10 11 c4 -4 9 -7 10 -11 c2 -6 -6 -10 -10 -4 Z" fill="var(--wonder-red)"/>
  ${scribble(48, 40, 140, 2.6)}${scribble(66, 18, 162)}
</svg>`,
  mid: `<svg viewBox="0 0 180 80" preserveAspectRatio="none" focusable="false">
  <rect x="1.5" y="0" width="177" height="80" fill="var(--paper-base)" stroke="var(--ink-faded)" stroke-width="3"/>
  ${scribble(14, 18, 160)}${scribble(32, 18, 166)}${scribble(50, 18, 150)}${scribble(68, 18, 162)}
</svg>`,
  bottom: `<svg viewBox="0 0 180 80" preserveAspectRatio="none" focusable="false">
  <rect x="1.5" y="0" width="177" height="78.5" fill="var(--paper-base)" stroke="var(--ink-faded)" stroke-width="3"/>
  ${scribble(14, 18, 128)}
  <path d="M104 46 c10 -14 20 -6 14 2 c-6 8 6 10 16 -2 c8 -10 16 -4 22 0" stroke="var(--ink-primary)" stroke-width="2.6" fill="none" stroke-linecap="round"/>
</svg>`,
  /** The outside of the folded letter: paper, the fold, and the seal on it. */
  outside: `<svg viewBox="0 0 180 80" preserveAspectRatio="none" focusable="false">
  <rect x="1.5" y="1.5" width="177" height="77" fill="var(--paper-warm)" stroke="var(--ink-faded)" stroke-width="3"/>
  <path d="M6 6 L90 44 L174 6" stroke="var(--paper-shadow)" stroke-width="2.4" fill="none"/>
  <circle cx="90" cy="46" r="15" fill="var(--wonder-red-dark)"/>
  <path d="M90 41 c-3 -5 -10 -2 -8 3 c1 3 5 6 8 9 c3 -3 7 -6 8 -9 c2 -5 -5 -8 -8 -3 Z" fill="var(--wonder-red-light)"/>
</svg>`,
  /** The back of the bottom flap: plain paper. */
  plain: `<svg viewBox="0 0 180 80" preserveAspectRatio="none" focusable="false">
  <rect x="1.5" y="1.5" width="177" height="77" fill="var(--paper-warm)" stroke="var(--ink-faded)" stroke-width="3"/>
</svg>`,
};

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
