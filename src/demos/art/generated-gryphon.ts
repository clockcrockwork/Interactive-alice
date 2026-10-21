/** Scoped Gryphon: whole-actor consumers or independently articulated chapter forelegs. */
import type { ArtStyle } from './treatments.ts';
import { GRYPHON_SVG } from './vectors.ts';

const sources = {
  whole: new URL(
    '../../assets/images/generated-layers/gryphon~whole.shore.generated.webp',
    import.meta.url,
  ).href,
  body: new URL(
    '../../assets/images/generated-layers/gryphon~body.shore.generated.webp',
    import.meta.url,
  ).href,
  near: new URL(
    '../../assets/images/generated-layers/gryphon~foreleg-near.shore.generated.webp',
    import.meta.url,
  ).href,
  far: new URL(
    '../../assets/images/generated-layers/gryphon~foreleg-far.shore.generated.webp',
    import.meta.url,
  ).href,
};
const scale = Math.min(240 / 1306, 220 / 1205);
const x = (240 - 1306 * scale) / 2;
const y = 220 - 1172 * scale;
const wholeScenes = ['lobster-quadrille', 'trial'];
// The landing shares the chapter's opening pose, but has no raised-paw action.
const chapterScenes = ['mock-turtle', 'duchess'];

function image(src: string, width: number, height: number, factor = 1, dx = 0, dy = 0): string {
  return `<image class="art__image" data-variant="any" data-rig-image="" href="${src}" x="${x + dx * scale}" y="${y + dy * scale}" width="${width * scale * factor}" height="${height * scale * factor}" preserveAspectRatio="xMidYMid meet"/>`;
}

export function generatedGryphonSvg(
  id: string,
  style: ArtStyle,
  demo?: string,
): string | undefined {
  if (
    id !== 'gryphon' ||
    style !== 'engraved' ||
    !demo ||
    (!wholeScenes.includes(demo) && !chapterScenes.includes(demo))
  )
    return undefined;
  const original = GRYPHON_SVG.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const drawing = !chapterScenes.includes(demo)
    ? image(sources.whole, 1306, 1205)
    : `${image(sources.body, 1305, 1205)}<g data-rig-part="" data-gryphon-part="far" style="--rig-origin: ${x + 1005 * scale}px ${y + 770 * scale}px; --gryphon-lift: ${-130 * scale}px">${image(sources.far, 1416, 1111, 0.91, 38, 217)}</g><g data-rig-part="" data-gryphon-part="near" style="--rig-origin: ${x + 795 * scale}px ${y + 660 * scale}px">${image(sources.near, 1305, 1205)}</g>`;
  return `<svg viewBox="0 0 240 220" focusable="false" data-generated-rig="gryphon" data-gryphon-scene="${demo}"><g data-rig-fallback="">${original}</g><g data-rig-generated="" visibility="hidden" display="none">${drawing}</g></svg>`;
}
