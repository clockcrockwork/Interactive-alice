/** The Caterpillar demo's props: the two bits of mushroom, one in each hand. */

const bit = (flip: boolean): string => `
<svg viewBox="0 0 200 160" focusable="false"${flip ? ' style="transform: scaleX(-1)"' : ''}>
  <path d="M20 150 C10 100 30 40 90 20 C140 6 190 30 196 60 C160 66 150 100 160 150 Z" fill="var(--ct-mushroom)"/>
  <path d="M20 150 C10 100 30 40 90 20 C140 6 190 30 196 60 C160 66 150 100 160 150 Z" fill="oklch(0% 0 0 / 0.1)" clip-path="inset(50% 0 0 0)"/>
  <ellipse cx="80" cy="60" rx="18" ry="10" fill="var(--ct-mushroom-spot)"/>
  <ellipse cx="140" cy="46" rx="12" ry="7" fill="var(--ct-mushroom-spot)"/>
  <path d="M30 150 Q90 120 150 150" fill="oklch(92% 0.03 80)"/>
  <path d="M24 150 h136" stroke="oklch(80% 0.04 80)" stroke-width="4"/>
</svg>`;

export const LEFT_BIT_SVG = bit(false);
export const RIGHT_BIT_SVG = bit(true);
