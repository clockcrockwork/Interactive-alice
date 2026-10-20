/**
 * The Caucus-race's props, and the parts of its picture its neighbours share: the
 * pool ends on the race's opening frame, and the Mouse's tale opens on its huddle.
 * The runners themselves come from the art registry; what is added here is drawn
 * in the runner's own 100 by 116 box, so it sits on a cut-out image as well.
 */

import type { RunnerKind } from '../art/vectors.ts';
import { RUNNERS } from '../art/vectors.ts';

export type { RunnerKind };
export { RUNNERS };

/** The thimble: plain metal, dented, catching the light only while presented. */
export const THIMBLE_SVG = `
<svg viewBox="0 0 80 90" focusable="false">
  <path d="M18 84 L14 30 Q40 6 66 30 L62 84 Z" fill="var(--cr-thimble)"/>
  <path d="M16 40 Q40 30 64 40" stroke="var(--cr-thimble-dent)" stroke-width="3" fill="none"/>
  <path d="M22 34 Q30 22 40 20" stroke="var(--cr-thimble-shine)" stroke-width="4" stroke-linecap="round" fill="none"/>
  ${Array.from({ length: 12 }, (_, i) => `<circle cx="${24 + (i % 4) * 11}" cy="${50 + Math.floor(i / 4) * 10}" r="2" fill="var(--cr-thimble-dent)"/>`).join('')}
</svg>`;

/**
 * Tenniel's Dodo carries a walking-stick and has a hand where a wing should be:
 * the cane is always there, so he is told apart from the other birds. One arm
 * rests on the cane; at "thinking" it goes to his forehead, a finger pressed upon
 * it, and three thoughts rise slowly; when he presents the thimble it is raised.
 */
const DODO_DRESS = `
<path d="M86 112 L82 66 q-1 -8 -9 -6" stroke="var(--sepia-deep)" stroke-width="3.5" stroke-linecap="round" fill="none"/>
<g class="cr__arm cr__arm--rest">
  <path d="M64 76 Q74 76 82 70" stroke="var(--sepia-mid)" stroke-width="7" stroke-linecap="round" fill="none"/>
  <circle cx="82" cy="70" r="4" fill="var(--paper-warm)"/>
</g>
<g class="cr__arm cr__arm--think">
  <path d="M62 78 Q86 68 76 33" stroke="var(--sepia-mid)" stroke-width="7" stroke-linecap="round" fill="none"/>
  <circle cx="75" cy="31" r="4" fill="var(--paper-warm)"/>
  <path d="M77 30 L82 33" stroke="var(--paper-warm)" stroke-width="2.6" stroke-linecap="round"/>
</g>
<g class="cr__arm cr__arm--present">
  <path d="M62 76 Q84 66 88 44" stroke="var(--sepia-mid)" stroke-width="7" stroke-linecap="round" fill="none"/>
  <circle cx="88" cy="42" r="4" fill="var(--paper-warm)"/>
</g>
<g class="cr__thoughts">
  <circle cx="88" cy="22" r="2.6" fill="var(--paper-base)" stroke="var(--ink-faded)" stroke-width="1.2" style="opacity: clamp(0, calc(var(--think, 0) * 3), 1)"/>
  <circle cx="93" cy="13" r="3.4" fill="var(--paper-base)" stroke="var(--ink-faded)" stroke-width="1.2" style="opacity: clamp(0, calc(var(--think, 0) * 3 - 1), 1)"/>
  <circle cx="97" cy="3.5" r="3.2" fill="var(--paper-base)" stroke="var(--ink-faded)" stroke-width="1.2" style="opacity: clamp(0, calc(var(--think, 0) * 3 - 2), 1)"/>
</g>`;

/** Alice's arm, out from her side to hold what she was given. */
const ALICE_DRESS = `
<g class="cr__arm cr__arm--hold">
  <path d="M64 64 Q70 70 72 76" stroke="var(--alice-dress)" stroke-width="9" stroke-linecap="round" fill="none"/>
  <path d="M72 76 L76 84" stroke="var(--alice-skin)" stroke-width="6" stroke-linecap="round"/>
</g>`;

/**
 * Adds a runner's own props to its figure: inside the drawing's group when the
 * figure is a vector, so they move with it, or over the box when it is an image.
 */
export function dressRunner(el: HTMLElement, kind: RunnerKind): void {
  const markup = kind === 'dodo' ? DODO_DRESS : kind === 'alice' ? ALICE_DRESS : '';
  if (!markup) {
    return;
  }
  const group = el.querySelector('.cr__figure');
  if (group) {
    group.insertAdjacentHTML('beforeend', markup);
    return;
  }
  el.insertAdjacentHTML(
    'beforeend',
    `<svg class="cr__over" viewBox="0 0 100 116" focusable="false" aria-hidden="true">${markup}</svg>`,
  );
}

/**
 * Who stands where when the party crowds round one of its own: the one in the
 * middle, then alternately right and left of it. Round the Dodo, Alice is at his
 * shoulder; round Alice, the Dodo is at hers, ready to present the thimble.
 */
const HUDDLE: Record<'dodo' | 'alice', readonly RunnerKind[]> = {
  dodo: ['dodo', 'alice', 'lory', 'duck', 'eaglet', 'mouse', 'crab', 'magpie'],
  alice: ['alice', 'dodo', 'mouse', 'lory', 'duck', 'eaglet', 'crab', 'magpie'],
};

/** A runner's place in a huddle, in quarter-spreads from its middle: 0, +1, -1, +2, ... */
export function huddleSlot(kind: RunnerKind, around: 'dodo' | 'alice'): number {
  const rank = HUDDLE[around].indexOf(kind);
  if (rank <= 0) {
    return 0;
  }
  return (rank % 2 === 1 ? 1 : -1) * Math.ceil(rank / 2);
}

/** Where a runner holds what it carries, in its box's own units (100 by 116). */
export const HANDS = {
  alicePocket: { u: 60, v: 88 },
  aliceHand: { u: 77, v: 84 },
  dodoHand: { u: 88, v: 36 },
  dodoRaised: { u: 88, v: 22 },
} as const;

/**
 * The race's opening frame, which the pool of tears ends on: the camera low at
 * the water, and the party just out of it in a loose two-row group along the
 * water's edge, each standing a little deep in it. A place is a point on the bank
 * turned into the ring's own angle and radius, so the same transform draws both
 * the arrival and the ring.
 */
export const OPENING = {
  camera: { spin: 0, tilt: 1, dolly: -200, lift: -36 },
  places: RUNNERS.map((_, index) => {
    const across = (index / (RUNNERS.length - 1)) * 2 - 1;
    const x = across * 0.95;
    const z = 0.1 + (index % 2) * 0.3;
    return {
      angle: (Math.atan2(x, z) * 180) / Math.PI,
      radius: Math.hypot(x, z),
      sink: 92 - (index % 2) * 22,
    };
  }),
} as const;
