/** Whole-pose cards only; Rabbit Hole's independent falling rig stays original. */
import type { AliceVariant } from './art.ts';
import type { ArtStyle } from './treatments.ts';
import { ALICE_SVG } from './vectors.ts';

const sources = {
  yellow: {
    src: new URL(
      '../../assets/images/figures/alice--falling-card.yellow.generated.webp',
      import.meta.url,
    ).href,
    foot: 1596,
  },
  blue: {
    src: new URL(
      '../../assets/images/figures/alice--falling-card.blue.generated.webp',
      import.meta.url,
    ).href,
    foot: 1597,
  },
};
let serial = 0;
export function generatedFallingCardSvg(
  id: string,
  style: ArtStyle,
  demo: string | undefined,
  variant: AliceVariant,
): string | undefined {
  // Duchess has hand/shoulder contacts; do not substitute without contact proof.
  if (id !== 'alice/falling' || style !== 'engraved' || (demo !== 'drink-me' && demo !== 'trial'))
    return undefined;
  const source = sources[variant];
  const original = ALICE_SVG.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const scale = Math.min(120 / 971, 200 / 1619);
  const paint = `falling-card-paint-${++serial}`;
  return `<svg width="120" height="200" viewBox="0 0 120 200" focusable="false" data-generated-rig="alice/falling-card"><g data-rig-fallback="">${original}</g><g data-rig-generated="" visibility="hidden" display="none"><defs><pattern id="${paint}" width="120" height="200" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse"><image class="art__image" data-variant="${variant}" data-rig-image="" href="${source.src}" x="${(120 - 971 * scale) / 2}" y="${200 - source.foot * scale}" width="${971 * scale}" height="${1619 * scale}" preserveAspectRatio="xMidYMid meet"/></pattern></defs><rect width="120" height="200" fill="url(#${paint})"/></g></svg>`;
}
