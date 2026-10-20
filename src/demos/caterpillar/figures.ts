/** The Caterpillar demo's props: the two bits of mushroom, one in each hand. */

const bit = (flip: boolean): string => `
<svg viewBox="0 0 200 160" focusable="false"${flip ? ' style="transform: scaleX(-1)"' : ''}>
  <path d="M20 150 C10 100 30 40 90 20 C140 6 190 30 196 60 C160 66 150 100 160 150 Z" fill="var(--ct-mushroom)"/>
  <path d="M20 150 C10 100 30 40 90 20 C140 6 190 30 196 60 C160 66 150 100 160 150 Z" fill="var(--ct-shade-soft)" opacity="0.25" clip-path="inset(50% 0 0 0)"/>
  <ellipse cx="80" cy="60" rx="18" ry="10" fill="var(--ct-mushroom-spot)"/>
  <ellipse cx="140" cy="46" rx="12" ry="7" fill="var(--ct-mushroom-spot)"/>
  <path d="M30 150 Q90 120 150 150" fill="var(--ct-mushroom-gill)"/>
  <path d="M24 150 h136" stroke="var(--ct-mushroom-edge)" stroke-width="4"/>
</svg>`;

export const LEFT_BIT_SVG = bit(false);
export const RIGHT_BIT_SVG = bit(true);

/** "Explain yourself!": the smoke curls into a question, and hangs over her. */
export const ASK_SVG = `
<svg class="ct__ask" viewBox="0 0 40 60" focusable="false">
  <path d="M9 17 Q9 4 21 4 Q33 4 33 16 Q33 25 21 30 L21 40" stroke="var(--ct-smoke)" stroke-width="6" fill="none" stroke-linecap="round"/>
  <circle cx="21" cy="52" r="4" fill="var(--ct-smoke)"/>
</svg>`;
