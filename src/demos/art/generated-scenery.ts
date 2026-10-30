/** Outdoor decorations use the shell's existing cached, atomic rig decoder. */
import { type ArtStyle, artStyle } from './treatments.ts';
import './generated-scenery.css';

const sources = {
  'court-floor': new URL('../../assets/images/scenery/court-floor.generated.webp', import.meta.url)
    .href,
  'night-trunk': new URL('../../assets/images/scenery/night-trunk.generated.webp', import.meta.url)
    .href,
  'night-wood': new URL('../../assets/images/scenery/night-wood.generated.webp', import.meta.url)
    .href,
  hedge: new URL('../../assets/images/scenery/field-hedge.generated.webp', import.meta.url).href,
  tree: new URL('../../assets/images/scenery/tree.generated.webp', import.meta.url).href,
  'edge-left': new URL('../../assets/images/scenery/edge-left.generated.webp', import.meta.url)
    .href,
  'edge-right': new URL('../../assets/images/scenery/edge-right.generated.webp', import.meta.url)
    .href,
  ground: new URL('../../assets/images/scenery/ground.generated.webp', import.meta.url).href,
} as const;

// Ratios are fixed before decode; final delivery dimensions are recorded in provenance.
const boxes = {
  'court-floor': [3, 1],
  'night-trunk': [1, 3],
  'night-wood': [3, 1],
  hedge: [3, 1],
  tree: [2, 3],
  'edge-left': [2, 3],
  'edge-right': [3, 4],
  ground: [3, 1],
} as const;

/** Flat/paper pages fetch no new images; pending/failed images paint nothing. */
export function scenery(
  id: keyof typeof sources,
  style: ArtStyle = typeof document === 'undefined' ? 'flat' : artStyle(),
): string {
  if (style !== 'engraved') return '';
  if (id === 'court-floor') {
    // One Court per demo. Pair each edge with its own mirror: grain cannot step
    // at a join. The viewBox crops uniformly rather than stretching the image.
    const image = (transform = ''): string =>
      `<image data-rig-image="" href="${sources[id]}" width="2172" height="724" transform="${transform}"/>`;
    return `<svg class="scenery" viewBox="0 0 21720 724" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-generated-rig="scenery/court-floor"><defs><pattern id="court-floor-grain" patternUnits="userSpaceOnUse" width="4344" height="724">${image()}${image('translate(4344 0) scale(-1 1)')}</pattern></defs><g data-rig-generated="" visibility="hidden" display="none"><rect width="21720" height="724" fill="url(#court-floor-grain)"/></g></svg>`;
  }
  const [width, height] = boxes[id];
  const align = id === 'edge-left' ? 'xMinYMax' : id === 'edge-right' ? 'xMaxYMax' : 'xMidYMax';
  const fit = id === 'night-wood' ? 'slice' : 'meet';
  return `<svg class="scenery" viewBox="0 0 ${width} ${height}" preserveAspectRatio="${align} ${fit}" aria-hidden="true" focusable="false" data-generated-rig="scenery/${id}"><g data-rig-generated="" visibility="hidden" display="none"><image data-rig-image="" href="${sources[id]}" width="${width}" height="${height}" preserveAspectRatio="${align} meet"/></g></svg>`;
}
