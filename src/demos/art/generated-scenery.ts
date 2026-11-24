/** Scene decorations use the shell's existing cached, atomic rig decoder. */

import {
  SCENERY_SOURCES as sources,
  WILDFLOWER_HIGHLANDS_PHONE as wildflowerHighlandsPhone,
} from './scenery-assets.ts';
import { type ArtStyle, artStyle } from './treatments.ts';
import './generated-scenery.css';

export { sceneryAssetSources } from './scenery-assets.ts';

// Ratios are fixed before decode; final delivery dimensions are recorded in provenance.
const boxes = {
  'court-wall': [3, 1],
  'court-floor': [3, 1],
  'night-trunk': [1, 3],
  'night-wood': [3, 1],
  hedge: [3, 1],
  tree: [2, 3],
  'edge-left': [2, 3],
  'edge-right': [3, 4],
  ground: [3, 1],
  'wildflower-highlands': [3, 1],
  'rabbit-mound': [1080, 412],
  'riverbank-sun': [156, 145],
} as const;

/** Flat/paper pages fetch no new images; pending/failed images paint nothing. */
export function scenery(
  id: keyof typeof sources,
  style: ArtStyle = typeof document === 'undefined' ? 'flat' : artStyle(),
): string {
  if (style !== 'engraved') return '';
  if (id === 'wildflower-highlands') {
    return `<picture class="scenery scenery--wildflower-highlands" aria-hidden="true"><source media="(max-width: 700px)" srcset="${wildflowerHighlandsPhone}"><img src="${sources[id]}" alt="" decoding="async"></picture>`;
  }
  if (id === 'rabbit-mound' || id === 'riverbank-sun') {
    const [width, height] = boxes[id];
    return `<img class="scenery scenery--${id}" src="${sources[id]}" width="${width}" height="${height}" alt="" decoding="async">`;
  }
  if (id === 'court-wall') {
    // Retain the existing wide rear plane. Mirrored bays share one decoded file;
    // the offset puts an open panel, not a pilaster, behind the central actors.
    const image = (transform = ''): string =>
      `<image data-rig-image="" href="${sources[id]}" width="2172" height="724" transform="${transform}"/>`;
    return `<svg class="scenery" viewBox="-1086 0 21720 724" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-generated-rig="scenery/court-wall"><defs><pattern id="court-wall-bays" patternUnits="userSpaceOnUse" width="4344" height="724">${image()}${image('translate(4344 0) scale(-1 1)')}</pattern></defs><g data-rig-generated="" visibility="hidden" display="none"><rect x="-1086" width="21720" height="724" fill="url(#court-wall-bays)"/></g></svg>`;
  }
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
  return `<svg class="scenery" viewBox="0 0 ${width} ${height}" preserveAspectRatio="${align} ${fit}" aria-hidden="true" focusable="false" data-generated-rig="scenery/${id}"><g data-rig-generated="" visibility="hidden" display="none"><image data-rig-image="" href="${sources[id]}" width="${width}" height="${height}" preserveAspectRatio="${align} ${fit}"/></g></svg>`;
}
