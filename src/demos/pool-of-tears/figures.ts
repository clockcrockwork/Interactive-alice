/** The White Rabbit's fan, held up to the camera: paper on sepia sticks, with a
    little of the Rabbit's own red in its leaf. Decorative SVG. */

import { type ArtStyle, artStyle } from '../art/treatments.ts';

export const FAN_SVG = `
<svg viewBox="0 0 200 160" focusable="false">
  ${Array.from({ length: 9 }, (_, i) => {
    const angle = -80 + i * 20;
    return `<path d="M100 150 L100 20" stroke="var(--sepia-light)" stroke-width="5" stroke-linecap="round" transform="rotate(${angle} 100 150)"/>`;
  }).join('')}
  <path d="M100 150 L20 70 A110 110 0 0 1 180 70 Z" fill="var(--paper-warm)" opacity="0.92"/>
  <path d="M100 150 L44 92 A80 80 0 0 1 156 92 Z" fill="var(--wonder-red-faded)" opacity="0.35"/>
  <circle cx="100" cy="150" r="7" fill="var(--sepia-dark)"/>
</svg>`;

/** Keep the original 200x160 fan box and its off-screen hand/pivot. */
export function fanMarkup(
  style: ArtStyle = typeof document === 'undefined' ? 'flat' : artStyle(),
): string {
  if (style !== 'engraved') return FAN_SVG;
  const src = new URL('../../assets/images/figures/fan.any.generated.webp', import.meta.url).href;
  // The measured rivet centre lands at y150; the CSS pivot stays at y160.
  return `<svg viewBox="0 0 200 160" focusable="false" data-generated-fan=""><image href="${src}" x="0" y="1.8" width="200" height="160" preserveAspectRatio="xMidYMid meet"/></svg>`;
}

/** One giant tear, in the pool's own water, with the light caught in it. */
export const TEAR_DROP_SVG = `
<svg viewBox="0 0 40 60" focusable="false">
  <path d="M20 2 C20 18 4 30 4 42 A16 16 0 0 0 36 42 C36 30 20 18 20 2 Z" fill="var(--pt-tear)" stroke="var(--pt-tear-edge)" stroke-width="1.5"/>
  <path d="M12 38 Q12 48 20 52" stroke="var(--pt-foam)" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.8"/>
</svg>`;
