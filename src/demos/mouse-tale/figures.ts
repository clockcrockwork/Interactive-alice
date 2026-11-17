/** The Mouse's tale's small props. The party, Dinah, the Rabbit and the house
    come from the art registry, the race and the Rabbit's house. */

/** One tear, on Alice's cheek. */
export const TEAR_SVG = `
<svg viewBox="0 0 20 30" focusable="false">
  <path d="M10 2 C10 10 2 16 2 21 A8 8 0 0 0 18 21 C18 16 10 10 10 2 Z" fill="var(--mt-tear)"/>
  <circle cx="7" cy="21" r="2" fill="var(--mt-tear-light)"/>
</svg>`;

/** Little footprints pattering in from the right, far off: six steps. */
export const FOOTPRINTS_SVG = `
<svg viewBox="0 0 240 60" focusable="false">
  ${Array.from({ length: 6 }, (_, i) => {
    const x = 220 - i * 40;
    const y = 30 + (i % 2) * 8;
    return `<g class="mt__step" style="--i: ${i}"><ellipse cx="${x}" cy="${y}" rx="5" ry="8" fill="var(--mt-print)"/><ellipse cx="${x + 12}" cy="${y - 10}" rx="5" ry="8" fill="var(--mt-print)"/></g>`;
  }).join('')}
</svg>`;

/**
 * The old Magpie's excuse, "the night-air doesn't suit my throat": a scarf it
 * wraps round itself before it goes. Drawn in the runner's own 100 by 116 box.
 */
export const SCARF = `
<g class="mt__scarf">
  <path d="M56 56 Q68 68 86 58" stroke="var(--mt-scarf)" stroke-width="9" stroke-linecap="round" fill="none"/>
  <path d="M62 62 L56 86" stroke="var(--mt-scarf)" stroke-width="7" stroke-linecap="round"/>
  <path d="M57 80 L56 86 M59 72 L58 76" stroke="var(--mt-scarf-stripe)" stroke-width="7"/>
</g>`;

/**
 * The Canary, calling to its children that it is high time they were all in
 * bed, and its three chicks, who come when called. A runner-sized box.
 */
export const CANARY_SVG = `
<svg viewBox="0 0 100 116" focusable="false">
  <g class="mt__canary-bird">
    <ellipse cx="62" cy="88" rx="17" ry="12" fill="var(--mt-canary)"/>
    <path d="M46 86 l-12 -4 l10 10 z" fill="var(--mt-canary-deep)"/>
    <circle cx="75" cy="72" r="9.5" fill="var(--mt-canary)"/>
    <path d="M84 70 l8 3 l-8 3 z" fill="var(--sepia-mid)"/>
    <circle cx="77" cy="70" r="1.7" fill="var(--ink-primary)"/>
    <path d="M58 99 v12 M66 99 v12" stroke="var(--sepia-mid)" stroke-width="2.5" stroke-linecap="round"/>
    <path class="mt__calling" d="M95 64 q4 5 0 10 M99 58 q7 11 0 22" stroke="var(--ink-faded)" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  </g>
  ${[
    [14, 108],
    [26, 110],
    [38, 108],
  ]
    .map(
      ([x, y], i) =>
        `<g class="mt__chick" style="--k: ${i}"><circle cx="${x}" cy="${y}" r="6" fill="var(--mt-chick)"/><path d="M${(x ?? 0) + 5} ${(y ?? 0) - 1} l4 1.5 l-4 1.5 z" fill="var(--sepia-mid)"/><circle cx="${(x ?? 0) + 2}" cy="${(y ?? 0) - 2}" r="1" fill="var(--ink-primary)"/></g>`,
    )
    .join('')}
</svg>`;
