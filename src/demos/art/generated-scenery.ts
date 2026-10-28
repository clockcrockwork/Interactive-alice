/** Outdoor decorations use the shell's existing cached, atomic rig decoder. */
import { type ArtStyle, artStyle } from './treatments.ts';
import './generated-scenery.css';

const sources = {
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
  const [width, height] = boxes[id];
  const align = id === 'edge-left' ? 'xMinYMax' : id === 'edge-right' ? 'xMaxYMax' : 'xMidYMax';
  const fit = id === 'night-wood' ? 'slice' : 'meet';
  return `<svg class="scenery" viewBox="0 0 ${width} ${height}" preserveAspectRatio="${align} ${fit}" aria-hidden="true" focusable="false" data-generated-rig="scenery/${id}"><g data-rig-generated="" visibility="hidden" display="none"><image data-rig-image="" href="${sources[id]}" width="${width}" height="${height}" preserveAspectRatio="${align} meet"/></g></svg>`;
}
