/** Riverbank-only sitting rig; CSS is loaded by the runtime, never build-time art. */
import type { AliceVariant } from './art.ts';
import type { ArtStyle } from './treatments.ts';
import { ALICE_SITTING_SVG } from './vectors.ts';

const sources = {
  yellow: {
    body: new URL(
      '../../assets/images/generated-layers/alice--sitting~body.yellow.generated.webp',
      import.meta.url,
    ).href,
    head: new URL(
      '../../assets/images/generated-layers/alice--sitting~head.yellow.generated.webp',
      import.meta.url,
    ).href,
    arm: new URL(
      '../../assets/images/generated-layers/alice--sitting~arm-right.yellow.generated.webp',
      import.meta.url,
    ).href,
  },
  blue: {
    body: new URL(
      '../../assets/images/generated-layers/alice--sitting~body.blue.generated.webp',
      import.meta.url,
    ).href,
    head: new URL(
      '../../assets/images/generated-layers/alice--sitting~head.blue.generated.webp',
      import.meta.url,
    ).href,
    arm: new URL(
      '../../assets/images/generated-layers/alice--sitting~arm-right.blue.generated.webp',
      import.meta.url,
    ).href,
  },
};
const lids = new URL(
  '../../assets/images/generated-layers/alice--sitting~lids.any.generated.webp',
  import.meta.url,
).href;

let serial = 0;

/** Each padded source has its own uniform map; equal canvases do not imply alignment. */
export function generatedAliceSittingSvg(
  id: string,
  style: ArtStyle,
  demo: string | undefined,
  variant: AliceVariant,
): string | undefined {
  if (id !== 'alice/sitting' || style !== 'engraved' || demo !== 'riverbank') return undefined;
  const source = sources[variant];
  const clipId = `alice-sitting-lids-${++serial}`;
  const image = (part: string, src: string, x: number, y: number, scale: number): string =>
    `<image class="art__image" data-sitting-layer="${part}" data-variant="${part === 'lids' ? 'any' : variant}" data-rig-image="" href="${src}" x="${x}" y="${y}" width="${1295 * scale}" height="${1215 * scale}" preserveAspectRatio="xMidYMid meet"/>`;
  const original = ALICE_SITTING_SVG.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  // Preserve the original body/arm/head paint order. The near sleeve overlaps
  // the bodice and the hair covers its neck seam without editing raster assets.
  const head = `<g class="rb__head" data-rig-part="" style="--rig-origin: 80.8px 64.7px">${image('head', source.head, 36, 7.7, 0.064)}<g class="rb__lids"><g transform="translate(36 7.7) scale(0.064)"><g transform="matrix(0.979 -0.254 0.254 0.979 -119.35 351.9)"><defs><clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><rect class="rb__generated-lid-reveal" x="530" y="0" width="340" height="85"/></clipPath></defs><g clip-path="url(#${clipId})">${image('lids', lids, 0, 0, 1)}</g></g></g></g></g>`;
  const arm = `<g class="rb__arm" data-rig-part="" style="--rig-origin: 104.475px 60.5px">${image('arm-right', source.arm, 73.4, 45.1, 0.055)}</g>`;
  return `<svg viewBox="0 0 160 150" focusable="false" data-generated-rig="alice/sitting"><g data-rig-fallback="">${original}</g><g data-rig-generated="" visibility="hidden" display="none">${image('body', source.body, 4, 10.496, 0.116)}${arm}${head}</g></svg>`;
}
