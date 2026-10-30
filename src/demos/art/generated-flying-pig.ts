/** Only the Duchess flying cutaway; the Kitchen staged transformation is untouched. */
import type { ArtStyle } from './treatments.ts';
import { PIG_BABY_SVG } from './vectors.ts';

const src = new URL(
  '../../assets/images/figures/pig-baby--flying.any.generated.webp',
  import.meta.url,
).href;
let serial = 0;
export function generatedFlyingPigSvg(
  id: string,
  style: ArtStyle,
  demo?: string,
): string | undefined {
  if (id !== 'pig-baby' || style !== 'engraved' || demo !== 'duchess') return undefined;
  const inner = PIG_BABY_SVG.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const paint = `flying-pig-${++serial}`;
  const top = 200 - 1176 * (200 / 1254);
  return `<svg width="200" height="200" viewBox="0 0 200 200" focusable="false" data-generated-rig="pig-baby/flying"><g data-rig-fallback="">${inner}</g><g data-rig-generated="" visibility="hidden" display="none"><defs><pattern id="${paint}" width="200" height="200" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse"><image class="art__image" data-variant="any" data-rig-image="" href="${src}" x="0" y="${top}" width="200" height="200" preserveAspectRatio="xMidYMid meet"/></pattern></defs><rect width="200" height="200" fill="url(#${paint})"/></g></svg>`;
}
