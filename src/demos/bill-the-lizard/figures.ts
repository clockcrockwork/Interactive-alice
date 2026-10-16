/**
 * Bill the Lizard's garden, where he comes down: the corner of the Rabbit's house
 * with its ladder and the chimney he left, a clump of the hedge he may go into,
 * and the brandy. Bill, the guinea-pigs and the Rabbit come from the art registry;
 * the rooftop he starts on is the house's own (`RIM_SVG` in rabbit-house).
 */

/** The corner of the house, at the left of the garden: its feet on the ground line. */
export const GARDEN_HOUSE_SVG = `
<svg class="bl__g-house-svg" viewBox="0 0 300 500" preserveAspectRatio="xMinYMax meet" focusable="false">
  <polygon points="-10,150 262,268 -10,268" fill="var(--bl-roof)"/>
  <path d="M-10 150 L262 268" stroke="var(--bl-roof-deep)" stroke-width="10"/>
  <rect x="118" y="80" width="44" height="140" fill="var(--bl-timber)"/>
  <rect x="110" y="72" width="60" height="14" fill="var(--bl-roof-deep)"/>
  <rect x="126" y="72" width="28" height="8" fill="var(--bl-soot)"/>
  <circle cx="140" cy="52" r="16" fill="var(--bl-soot)" opacity="0.28"/>
  <circle cx="128" cy="30" r="12" fill="var(--bl-soot)" opacity="0.2"/>
  <circle cx="150" cy="12" r="9" fill="var(--bl-soot)" opacity="0.14"/>
  <rect x="-10" y="262" width="230" height="238" fill="var(--bl-wall)"/>
  <rect x="200" y="262" width="20" height="238" fill="var(--bl-wall-shade)"/>
  <rect x="40" y="320" width="84" height="80" fill="var(--bl-glass)" stroke="var(--bl-timber)" stroke-width="8"/>
  <path d="M82 320 v80 M40 360 h84" stroke="var(--bl-timber)" stroke-width="5"/>
  <path d="M206 500 L236 250 M236 500 L266 250 M210 466 h30 M214 432 h30 M218 398 h30 M222 364 h30 M226 330 h30 M230 296 h30" stroke="var(--bl-timber)" stroke-width="7" stroke-linecap="round"/>
</svg>`;

/** A clump of the hedge, round enough to swallow a lizard head first. */
export const CLUMP_SVG = `
<svg viewBox="0 0 200 140" focusable="false">
  <circle cx="50" cy="80" r="48" fill="var(--bl-hedge)"/>
  <circle cx="104" cy="56" r="56" fill="var(--bl-hedge-light)"/>
  <circle cx="156" cy="84" r="44" fill="var(--bl-hedge-deep)"/>
  <rect x="10" y="96" width="180" height="44" fill="var(--bl-hedge-deep)"/>
</svg>`;

/** The brandy: a little dark bottle, its neck up; it tips toward his mouth. */
export const BOTTLE_SVG = `
<svg viewBox="0 0 40 90" focusable="false">
  <rect x="15" y="2" width="10" height="10" rx="2" fill="var(--bl-cork)"/>
  <path d="M14 12 h12 v16 q12 6 12 22 v34 q0 4 -4 4 h-28 q-4 0 -4 -4 v-34 q0 -16 12 -22 z" fill="var(--bl-brandy)"/>
  <rect x="8" y="50" width="24" height="16" rx="2" fill="var(--paper-warm)"/>
</svg>`;

/** Leaves knocked out of the hedge: each one carries its own flight. */
export const LEAVES = Array.from({ length: 10 }, (_, i) => {
  const dx = (i - 4.5) * 14 + ((i * 31) % 9);
  const dy = 30 + ((i * 47) % 40);
  const land = 6 + ((i * 23) % 14);
  const spin = ((i * 67) % 240) - 120;
  return `<span class="bl__leaf" style="--dx: ${dx}; --dy: ${dy}; --land: ${land}; --spin: ${spin}"></span>`;
}).join('');
