/** Static scene props: retain the original SVG until the intact source decodes. */
import { type ArtStyle, artStyle } from './treatments.ts';

const sources = {
  'hedge-clump': new URL(
    '../../assets/images/figures/hedge-clump.any.generated.webp',
    import.meta.url,
  ).href,
  'mushroom-piece': new URL(
    '../../assets/images/figures/mushroom-piece.any.generated.webp',
    import.meta.url,
  ).href,
  'crown-cushion': new URL(
    '../../assets/images/figures/crown-cushion.any.generated.webp',
    import.meta.url,
  ).href,
};

type Prop = keyof typeof sources;
let serial = 0;

export function generatedSceneProp(
  name: Prop,
  original: string,
  box: readonly [number, number],
  placement: readonly [number, number, number, number],
  style: ArtStyle = typeof document === 'undefined' ? 'flat' : artStyle(),
): string {
  if (style !== 'engraved') return original;
  const [width, height] = box;
  const [x, y, imageWidth, imageHeight] = placement;
  const paint = `scene-prop-${name}-${++serial}`;
  // Retain root attributes, including the right mushroom's sole mirror.
  const root = original.match(/^\s*<svg\b[^>]*>/)?.[0];
  if (!root) return original;
  const contents = original.slice(root.length).replace(/<\/svg>\s*$/, '');
  return `${root.slice(0, -1)} data-generated-rig="prop/${name}"><g data-rig-fallback="">${contents}</g><g data-rig-generated="" visibility="hidden" display="none"><defs><pattern id="${paint}" width="${width}" height="${height}" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse"><image data-rig-image="" href="${sources[name]}" x="${x}" y="${y}" width="${imageWidth}" height="${imageHeight}" preserveAspectRatio="xMidYMid meet"/></pattern></defs><rect width="${width}" height="${height}" fill="url(#${paint})"/></g></svg>`;
}
