/** The Mouse's tale's small props. The party, Dinah, the Rabbit and the house
    come from the art registry and the Rabbit's house. */

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
