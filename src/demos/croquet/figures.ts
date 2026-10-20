/**
 * The croquet-ground's own card people and props, drawn once as SVG in the
 * card soldier's box (120 by 220, feet on the bottom edge): the procession by
 * suit, as the book has it (ten soldiers carrying clubs, ten courtiers
 * ornamented all over with diamonds, the royal children with hearts), the back
 * of the pack that a card lying on its face shows, the King's crown on its
 * crimson cushion for the Knave to carry, and the executioner with his axe.
 * No words anywhere.
 */

const INK = 'var(--ink-primary)';
const RED = 'var(--cq-red, var(--wonder-red))';
const SKIN = 'var(--paper-warm)';
const CARD = 'var(--paper-base)';
const GOLD = 'color-mix(in oklab, var(--world-glow) 55%, var(--sepia-mid))';

/** The card, oblong and flat, with its hands and feet at the corners. */
const body = (x = 30, y = 80, w = 60, h = 130): string =>
  `<path d="M${x + 2} ${y + h} l-6 8 M${x + w - 2} ${y + h} l6 8" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` +
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${CARD}" stroke="${INK}" stroke-width="3"/>` +
  `<circle cx="${x - 3}" cy="${y + 8}" r="5.5" fill="${SKIN}" stroke="${INK}" stroke-width="1.5"/>` +
  `<circle cx="${x + w + 3}" cy="${y + 8}" r="5.5" fill="${SKIN}" stroke="${INK}" stroke-width="1.5"/>`;

const head = (cx = 60, cy = 56, r = 22): string =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${SKIN}"/>` +
  `<circle cx="${cx - r * 0.32}" cy="${cy + 1}" r="2" fill="${INK}"/>` +
  `<circle cx="${cx + r * 0.32}" cy="${cy + 1}" r="2" fill="${INK}"/>`;

const club = (x: number, y: number, s = 1): string =>
  `<g transform="translate(${x} ${y}) scale(${s})" fill="${INK}"><circle cx="0" cy="-6" r="5"/><circle cx="-5.5" cy="2" r="5"/><circle cx="5.5" cy="2" r="5"/><path d="M-1.6 2 h3.2 l2.6 9 h-8.4 z"/></g>`;

const diamond = (x: number, y: number, s = 1): string =>
  `<path d="M${x} ${y - 9 * s} l${7 * s} ${9 * s} l${-7 * s} ${9 * s} l${-7 * s} ${-9 * s} z" fill="${RED}"/>`;

const heart = (x: number, y: number, s = 1): string =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -3 C-3 -10 -12 -8 -11 -1 C-10 5 -3 8 0 12 C3 8 10 5 11 -1 C12 -8 3 -10 0 -3 Z" fill="${RED}"/>`;

const spade = (x: number, y: number, s = 1): string =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -11 C-4 -4 -11 -1 -10 5 C-9 10 -3 10 -1 6 L-3 12 H3 L1 6 C3 10 9 10 10 5 C11 -1 4 -4 0 -11 Z" fill="${INK}"/>`;

/** A soldier of clubs, carrying a club over the shoulder. */
export const CLUB_SOLDIER_SVG = `
<svg viewBox="0 0 120 220" focusable="false">
  ${body()}
  ${club(46, 104)}${club(74, 104)}${club(60, 144, 1.3)}${club(46, 184)}${club(74, 184)}
  ${head()}
  <path d="M38 44 q22 -26 44 0 v-6 q-22 -14 -44 0 z" fill="${INK}"/>
  <path d="M93 86 L106 22" stroke="var(--sepia-dark)" stroke-width="6" stroke-linecap="round"/>
  <ellipse cx="107" cy="20" rx="8" ry="11" fill="var(--sepia-dark)" transform="rotate(12 107 20)"/>
  <circle cx="103" cy="16" r="2" fill="var(--sepia-deep)"/><circle cx="110" cy="24" r="2" fill="var(--sepia-deep)"/>
</svg>`;

/** A courtier ornamented all over with diamonds, a diamond in his cap. */
export const COURTIER_SVG = `
<svg viewBox="0 0 120 220" focusable="false">
  ${body()}
  ${[0, 1, 2, 3, 4]
    .flatMap((row) =>
      [0, 1, 2].map((col) => diamond(42 + col * 18 + (row % 2) * 9 - 4.5, 98 + row * 24, 0.62)),
    )
    .join('')}
  ${head()}
  <path d="M36 42 q24 -28 48 0 z" fill="var(--sepia-mid)"/>
  ${diamond(60, 26, 0.8)}
</svg>`;

/** A royal child: a small card of hearts with a circlet, arms out to the side,
    hand in hand with the next as they jump along. */
export const ROYAL_CHILD_SVG = `
<svg viewBox="0 0 120 220" focusable="false">
  <path d="M30 104 L4 96 M90 104 L116 96" stroke="${SKIN}" stroke-width="7" stroke-linecap="round"/>
  <circle cx="4" cy="96" r="6" fill="${SKIN}"/><circle cx="116" cy="96" r="6" fill="${SKIN}"/>
  ${body(32, 94, 56, 112)}
  ${heart(60, 128, 1.1)}${heart(60, 172, 1.1)}
  ${head(60, 72, 22)}
  <path d="M42 54 l4 -14 l8 9 l6 -12 l6 12 l8 -9 l4 14 z" fill="${GOLD}"/>
</svg>`;

/** The back of the pack, the same on every card: a lattice in the court's red. */
export const CARD_BACK_SVG = `
<svg viewBox="0 0 120 220" focusable="false">
  <path d="M32 210 l-6 8 M88 210 l6 8" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
  <rect x="30" y="80" width="60" height="130" rx="5" fill="${CARD}" stroke="${INK}" stroke-width="3"/>
  <rect x="36" y="86" width="48" height="118" rx="3" fill="none" stroke="${RED}" stroke-width="3"/>
  <path d="M36 98 L84 146 M36 122 L84 170 M36 146 L84 194 M42 86 L84 128 M66 86 L84 104 M36 170 L70 204 M36 194 L46 204
           M84 98 L36 146 M84 122 L36 170 M84 146 L36 194 M78 86 L36 128 M54 86 L36 104 M84 170 L50 204 M84 194 L74 204"
        stroke="${RED}" stroke-width="2" opacity="0.8"/>
  <circle cx="60" cy="56" r="22" fill="var(--sepia-dark)"/>
  <path d="M44 40 q16 -18 32 0" stroke="var(--sepia-deep)" stroke-width="6" fill="none" stroke-linecap="round"/>
</svg>`;

/** The King's crown on a crimson velvet cushion, tasselled at the corners. */
export const CUSHION_SVG = `
<svg viewBox="0 0 100 60" focusable="false">
  <path d="M6 40 Q4 30 14 28 H86 Q96 30 94 40 Q96 52 86 54 H14 Q4 52 6 40 Z" fill="var(--wonder-red-dark)"/>
  <path d="M14 30 Q50 38 86 30" stroke="${RED}" stroke-width="3" fill="none" opacity="0.7"/>
  <circle cx="8" cy="54" r="3.5" fill="${GOLD}"/><circle cx="92" cy="54" r="3.5" fill="${GOLD}"/>
  <path d="M30 32 l5 -22 l10 12 l5 -18 l5 18 l10 -12 l5 22 z" fill="${GOLD}"/>
  <circle cx="50" cy="26" r="2.6" fill="${RED}"/>
</svg>`;

/** The executioner: a spade card in a black hood, with an axe that swings
    (`.cq__axe`, turned about his hands at the card's top corner; at rest it
    points out to his side, a half turn brings it over the top, a whole turn to
    the other side). */
export const EXECUTIONER_SVG = `
<svg viewBox="0 0 120 220" focusable="false" overflow="visible">
  ${body()}
  ${spade(60, 110, 1.1)}${spade(60, 182, 1.1)}
  <path d="M36 74 Q34 30 60 28 Q86 30 84 74 Z" fill="${INK}"/>
  <ellipse cx="51" cy="56" rx="5" ry="3.4" fill="${SKIN}"/><ellipse cx="69" cy="56" rx="5" ry="3.4" fill="${SKIN}"/>
  <circle cx="51" cy="56" r="1.6" fill="${INK}"/><circle cx="69" cy="56" r="1.6" fill="${INK}"/>
  <g class="cq__axe">
    <path d="M90 88 H200" stroke="var(--sepia-dark)" stroke-width="6" stroke-linecap="round"/>
    <path d="M190 84 L210 64 Q230 88 210 112 L190 92 Z" fill="var(--paper-shadow)" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  </g>
</svg>`;
