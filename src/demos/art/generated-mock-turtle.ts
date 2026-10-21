/** The quadrille host: generated body plus original live SVG tears. */
import type { ArtStyle } from './treatments.ts';
import { MOCK_TURTLE_SVG } from './vectors.ts';

const src = new URL(
  '../../assets/images/generated-layers/mock-turtle~whole.any.generated.webp',
  import.meta.url,
).href;

export function generatedMockTurtleSvg(style: ArtStyle, demo?: string): string | undefined {
  // The other scene has independent flappers. Do not duplicate those limbs.
  if (style !== 'engraved' || demo !== 'lobster-quadrille') return undefined;
  const inner = MOCK_TURTLE_SVG.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const tears = [...inner.matchAll(/<path class="lq__tear"[^>]*\/>/g)].map((m) => m[0]);
  const body = inner.replace(/<path class="lq__tear"[^>]*\/>/g, '');
  const scale = 220 / 1202;
  const x = (240 - 1309 * scale) / 2;
  const y = 220 - 1132 * scale;
  const mappedTears = tears
    .map(
      (tear, index) =>
        `<g data-rig-map="" style="--rig-map: translate(${index === 0 ? -2 : 12}px, ${index === 0 ? -2 : 5}px)">${tear}</g>`,
    )
    .join('');
  return `<svg viewBox="0 0 240 220" focusable="false" data-generated-rig="mock-turtle"><g data-rig-fallback="">${body}</g><g data-rig-generated="" visibility="hidden" display="none"><image class="art__image" data-variant="any" data-rig-image="" href="${src}" x="${x}" y="${y}" width="${1309 * scale}" height="220" preserveAspectRatio="xMidYMid meet"/></g>${mappedTears}</svg>`;
}
