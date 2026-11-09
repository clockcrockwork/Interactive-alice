/** A shared-source pig rig; raster pixels stay untouched by the composition. */
import type { ArtStyle } from './treatments.ts';
import { PIG_TROTTING_SVG } from './vectors.ts';

const STAGE_WIDTH = 1500;
const SOURCE_HEIGHT = 1049;
const SCALE = 200 / STAGE_WIDTH;
const TOP = 140 - 957 * SCALE;

const layers = [
  {
    part: 'legs-hind',
    src: new URL(
      '../../assets/images/generated-layers/pig--trotting~legs-hind.any.generated.webp',
      import.meta.url,
    ).href,
    width: 1500,
    pivot: [1162.5, 447],
  },
  {
    part: 'legs-fore',
    src: new URL(
      '../../assets/images/generated-layers/pig--trotting~legs-fore.any.generated.webp',
      import.meta.url,
    ).href,
    width: 1500,
    pivot: [532, 533],
  },
  {
    part: 'body',
    src: new URL(
      '../../assets/images/generated-layers/pig--trotting~body.any.generated.webp',
      import.meta.url,
    ).href,
    width: 1499,
    pivot: undefined,
  },
] as const;

/** Only the two stages with the existing, separately phased leg animations. */
export function generatedPigSvg(style: ArtStyle, demo?: string): string | undefined {
  if (style !== 'engraved' || (demo !== 'pig-and-pepper' && demo !== 'cheshire-cat')) {
    return undefined;
  }
  let originalBody = PIG_TROTTING_SVG.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const originalLegs = new Map<string, string>();
  for (const part of ['legs-hind', 'legs-fore']) {
    const pattern = new RegExp(`<g data-part="${part}">([\\s\\S]*?)<\\/g>`);
    const match = originalBody.match(pattern);
    if (!match) throw new Error(`missing original pig part ${part}`);
    originalLegs.set(part, match[1] ?? '');
    originalBody = originalBody.replace(pattern, '');
  }
  const drawing = layers
    .map(({ part, src, width, pivot }) => {
      // A raster's transparent canvas is still its SVG fill-box. Explicit root
      // coordinates keep the pivot at the measured shoulder/hip instead, while
      // leaving each scene's rotation keyframes and opposite phases unchanged.
      const origin = pivot
        ? ` data-rig-part="" style="--rig-origin: ${pivot[0] * SCALE}px ${TOP + pivot[1] * SCALE}px"`
        : '';
      const x = ((STAGE_WIDTH - width) / 2) * SCALE;
      const fallback = part === 'body' ? originalBody : originalLegs.get(part);
      return `<g data-part="${part}"${origin}><g data-rig-fallback="">${fallback}</g><g data-rig-generated="" visibility="hidden" display="none"><image class="art__image" data-variant="any" data-rig-image="" href="${src}" x="${x}" y="${TOP}" width="${width * SCALE}" height="${SOURCE_HEIGHT * SCALE}" preserveAspectRatio="xMidYMid meet"/></g></g>`;
    })
    .join('');
  return `<svg viewBox="0 0 200 140" focusable="false" data-generated-rig="pig/trotting">${drawing}</svg>`;
}
