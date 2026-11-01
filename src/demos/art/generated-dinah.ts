import { ART } from './registry.ts';
import type { ArtStyle } from './treatments.ts';
import { DINAH_SVG } from './vectors.ts';

/** Use the seated cutout without losing the authored figure if it fails to decode. */
export function generatedDinahSvg(id: string, style: ArtStyle, demo?: string): string | undefined {
  if (
    id !== 'dinah-cat' ||
    style !== 'engraved' ||
    (demo && demo !== 'pool-of-tears' && demo !== 'mouse-tale')
  ) {
    return undefined;
  }
  const entry = ART[id];
  if (entry?.kind !== 'vector' || !entry.generated?.any) return undefined;
  const { src, width, height, footY } = entry.generated.any;
  const [boxWidth, boxHeight] = entry.box;
  const scale = Math.min(boxWidth / width, boxHeight / height);
  const imageWidth = width * scale;
  const imageHeight = height * scale;
  const x = (boxWidth - imageWidth) / 2;
  const y = boxHeight - footY * scale;
  const fallback = DINAH_SVG.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return `<svg viewBox="0 0 ${boxWidth} ${boxHeight}" focusable="false" data-generated-rig="dinah-cat"><g data-rig-fallback="">${fallback}</g><g data-rig-generated="" visibility="hidden" display="none"><image class="art__image" data-variant="any" data-rig-image="" href="${src}" x="${x}" y="${y}" width="${imageWidth}" height="${imageHeight}" preserveAspectRatio="xMidYMid meet"/></g></svg>`;
}
