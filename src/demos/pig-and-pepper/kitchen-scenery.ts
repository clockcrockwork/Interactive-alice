import { type ArtStyle, artStyle } from '../art/treatments.ts';

const sources = {
  wall: new URL('../../assets/images/scenery/kitchen-wall.generated.webp', import.meta.url).href,
  floor: new URL('../../assets/images/scenery/kitchen-floor.generated.webp', import.meta.url).href,
} as const;

/** Decorative planes use the existing atomic rig decoder; flat and paper load nothing. */
export function kitchenScenery(
  plane: keyof typeof sources,
  style: ArtStyle = typeof document === 'undefined' ? 'flat' : artStyle(),
): string {
  if (style !== 'engraved') return '';
  // Floor content bounds at alpha >= 16: x=[5,2165), y=[54,698).
  // Crop near-transparent margins; preserve pixel proportions under cover.
  const [width, height] = plane === 'wall' ? [2, 1] : [2172, 724];
  const viewBox = plane === 'wall' ? '0 0 2 1' : '5 54 2160 644';
  const align = plane === 'wall' ? 'xMidYMax' : 'xMidYMin';
  return `<svg class="pp__${plane}-art" viewBox="${viewBox}" preserveAspectRatio="${align} slice" aria-hidden="true" focusable="false" data-generated-rig="kitchen/${plane}"><g data-rig-generated="" visibility="hidden" display="none"><image data-rig-image="" href="${sources[plane]}" width="${width}" height="${height}" preserveAspectRatio="${align} meet"/></g></svg>`;
}
