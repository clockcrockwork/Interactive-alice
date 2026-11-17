/** Seated kitchen/arrival poses; walking keeps its original contact geometry. */
import type { ArtStyle } from './treatments.ts';
import { DUCHESS_SVG } from './vectors.ts';

const image = new URL(
  '../../assets/images/figures/duchess--seated.any.generated.webp',
  import.meta.url,
).href;
const kitchenHeight = 1306 * (180 / 1205);
const arrivalWidth = 1205 * (260 / 1306);
let serial = 0;

export function generatedSeatedDuchessSvg(
  id: string,
  style: ArtStyle,
  demo?: string,
): string | undefined {
  if (id !== 'duchess' || style !== 'engraved' || (demo !== 'pig-and-pepper' && demo !== 'croquet'))
    return undefined;
  // Kitchen has a separately animated baby. Croquet is a contact-free arrival
  // and uses the full-height source fit, not the kitchen's smaller lap fit.
  const width = demo === 'croquet' ? arrivalWidth : 180;
  const height = demo === 'croquet' ? 260 : kitchenHeight;
  const original = DUCHESS_SVG.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const paint = `seated-duchess-paint-${++serial}`;
  // Scenes still own all motion. This fixed rectangle preserves the original
  // whole-figure animation reference box for either intact source placement.
  return `<svg width="240" height="260" viewBox="0 0 240 260" focusable="false" data-generated-rig="duchess/seated"><g data-rig-fallback="">${original}</g><g data-rig-generated="" visibility="hidden" display="none"><defs><pattern id="${paint}" width="240" height="260" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse"><image class="art__image" data-variant="any" data-rig-image="" href="${image}" x="${(240 - width) / 2}" y="${260 - height}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/></pattern></defs><rect width="240" height="260" fill="url(#${paint})"/></g></svg>`;
}
