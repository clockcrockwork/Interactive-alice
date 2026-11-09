/** Chapter-local whole pose; the tucked bird remains the original live SVG. */
import type { AliceVariant } from './art.ts';
import type { ArtStyle } from './treatments.ts';
import { ALICE_SVG } from './vectors.ts';

const sources = {
  yellow: {
    src: new URL(
      '../../assets/images/figures/alice--duchess-hold.yellow.generated.webp',
      import.meta.url,
    ).href,
    height: 1619,
    sole: 1597,
  },
  blue: {
    src: new URL(
      '../../assets/images/figures/alice--duchess-hold.blue.generated.webp',
      import.meta.url,
    ).href,
    height: 1620,
    sole: 1609,
  },
};
let serial = 0;
export function generatedDuchessAliceSvg(
  id: string,
  style: ArtStyle,
  demo: string | undefined,
  variant: AliceVariant,
): string | undefined {
  if (id !== 'alice/falling' || style !== 'engraved' || demo !== 'duchess') return undefined;
  const source = sources[variant];
  const scale = Math.min(120 / 971, 200 / source.height);
  const original = ALICE_SVG.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const paint = `duchess-alice-paint-${++serial}`;
  return `<svg width="120" height="200" viewBox="0 0 120 200" focusable="false" data-generated-rig="alice/duchess-hold" data-duchess-variant="${variant}"><g data-rig-fallback="">${original}</g><g data-rig-generated="" visibility="hidden" display="none"><defs><pattern id="${paint}" width="120" height="200" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse"><image class="art__image" data-variant="${variant}" data-rig-image="" href="${source.src}" x="${(120 - 971 * scale) / 2}" y="${200 - source.sole * scale}" width="${971 * scale}" height="${source.height * scale}" preserveAspectRatio="xMidYMid meet"/></pattern></defs><rect width="120" height="200" fill="url(#${paint})"/></g></svg>`;
}
