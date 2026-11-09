/** Whole standing pose only; the scene retains every walking/contact transform. */
import type { ArtStyle } from './treatments.ts';
import { DUCHESS_SVG } from './vectors.ts';

const image = new URL('../../assets/images/figures/duchess.any.generated.webp', import.meta.url)
  .href;
// Preserve the old approximate chin height and visible floor together. This is
// not proof of literal chin/shoulder contact, which the old composition lacks.
const scale = 140 / (1299 - 310);
let serial = 0;

export function generatedWalkingDuchessSvg(
  id: string,
  style: ArtStyle,
  demo?: string,
): string | undefined {
  if (id !== 'duchess' || style !== 'engraved' || demo !== 'duchess') return undefined;
  const original = DUCHESS_SVG.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const paint = `walking-duchess-paint-${++serial}`;
  // The 240 x 260 paint box keeps the scene's whole-art bob and outer lean,
  // shrug and flinch pivots intact. Alice is owned by its separate chapter adapter; the live bird stays original.
  return `<svg width="240" height="260" viewBox="0 0 240 260" focusable="false" data-generated-rig="duchess/walking"><g data-rig-fallback="">${original}</g><g data-rig-generated="" visibility="hidden" display="none"><defs><pattern id="${paint}" width="240" height="260" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse"><image class="art__image" data-variant="any" data-rig-image="" href="${image}" x="${120 - 640 * scale}" y="${260 - 1299 * scale}" width="${1205 * scale}" height="${1305 * scale}" preserveAspectRatio="xMidYMid meet"/></pattern></defs><rect width="240" height="260" fill="url(#${paint})"/></g></svg>`;
}
