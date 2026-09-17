/** The Caucus-race's props. The runners themselves come from the art registry. */

export type { RunnerKind } from '../art/vectors.ts';
export { RUNNERS } from '../art/vectors.ts';

export const THIMBLE_SVG = `
<svg viewBox="0 0 80 90" focusable="false">
  <path d="M18 84 L14 30 Q40 6 66 30 L62 84 Z" fill="var(--cr-thimble)"/>
  <path d="M16 40 Q40 30 64 40" stroke="oklch(60% 0.05 80)" stroke-width="3" fill="none"/>
  ${Array.from({ length: 12 }, (_, i) => `<circle cx="${24 + (i % 4) * 11}" cy="${50 + Math.floor(i / 4) * 10}" r="2" fill="oklch(60% 0.05 80)"/>`).join('')}
</svg>`;
