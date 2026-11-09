/** A scene-local replacement for leaves only: nest, shoulders and neck stay live. */
import { type ArtStyle, artStyle } from '../art/treatments.ts';

const source = new URL(
  '../../assets/images/scenery/caterpillar-canopy.generated.webp',
  import.meta.url,
).href;

export function generatedCanopyLeaves(
  original: string,
  style: ArtStyle = typeof document === 'undefined' ? 'flat' : artStyle(),
): string {
  if (style !== 'engraved') return original;
  // The inner SVG owns readiness without affecting the separate shoulder rig.
  // Same 1000-unit coordinates; overscan stays behind the outer canvas's crop.
  return `<svg viewBox="0 0 1000 1000" width="1000" height="1000" overflow="visible" aria-hidden="true" focusable="false" data-generated-rig="scenery/caterpillar-canopy"><g data-rig-fallback="">${original}</g><g data-rig-generated="" visibility="hidden" display="none"><image data-rig-image="" href="${source}" x="-180" y="348" width="1360" height="777.142857" preserveAspectRatio="xMidYMid meet"/></g></svg>`;
}
