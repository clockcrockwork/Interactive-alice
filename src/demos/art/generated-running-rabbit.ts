/** Retain the outer SVG that runs, bounces and mirrors in each scene. */
import type { ArtStyle } from './treatments.ts';
import { RABBIT_SVG } from './vectors.ts';

const source = new URL(
  '../../assets/images/figures/white-rabbit--running.any.generated.webp',
  import.meta.url,
).href;
const scenes = ['riverbank', 'rabbit-hole', 'pool-of-tears', 'mouse-tale'];
let serial = 0;
export function generatedRunningRabbitSvg(
  id: string,
  style: ArtStyle,
  demo?: string,
): string | undefined {
  if (id !== 'white-rabbit/running' || style !== 'engraved' || !demo || !scenes.includes(demo))
    return undefined;
  const original = RABBIT_SVG.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const scale = 120 / 1402;
  const paint = `running-rabbit-paint-${++serial}`;
  return `<svg width="120" height="100" viewBox="0 0 120 100" focusable="false" data-generated-rig="white-rabbit/running"><g data-rig-fallback="">${original}</g><g data-rig-generated="" visibility="hidden" display="none"><defs><pattern id="${paint}" width="120" height="100" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse"><image class="art__image" data-variant="any" data-rig-image="" href="${source}" x="0" y="${98 - 1067 * scale}" width="120" height="${1122 * scale}" preserveAspectRatio="xMidYMid meet"/></pattern></defs><rect width="120" height="100" fill="url(#${paint})"/></g></svg>`;
}
