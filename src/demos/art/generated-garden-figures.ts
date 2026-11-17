/** Garden spectators preserve their feet-at-origin SVG placement and outer action. */
import { ART } from './registry.ts';
import type { ArtStyle } from './treatments.ts';

const sources: Record<
  string,
  { src: string; size: [number, number]; foot: number; scenes: string[] }
> = {
  'white-rabbit/garden': {
    src: new URL(
      '../../assets/images/generated-layers/white-rabbit-garden~whole.any.generated.webp',
      import.meta.url,
    ).href,
    size: [1402, 1122],
    foot: 1078,
    scenes: ['rabbit-house', 'bill-the-lizard'],
  },
  pat: {
    src: new URL(
      '../../assets/images/generated-layers/pat~whole.any.generated.webp',
      import.meta.url,
    ).href,
    size: [1182, 1330],
    foot: 1296,
    scenes: ['rabbit-house'],
  },
};
let serial = 0;
export function generatedGardenFigureSvg(
  id: string,
  style: ArtStyle,
  demo?: string,
): string | undefined {
  const source = sources[id];
  const entry = ART[id];
  if (
    !source ||
    style !== 'engraved' ||
    !demo ||
    !source.scenes.includes(demo) ||
    entry?.kind !== 'vector'
  )
    return undefined;
  const [w, h] = entry.box;
  const [sw, sh] = source.size;
  const scale = Math.min(w / sw, h / sh);
  const x = (w - sw * scale) / 2;
  const y = h - source.foot * scale;
  const paint = `garden-paint-${++serial}`;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" focusable="false" data-generated-rig="${id}"><g data-rig-fallback="">${entry.fragment ?? entry.markup}</g><g data-rig-generated="" visibility="hidden" display="none"><defs><pattern id="${paint}" width="${w}" height="${h}" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse"><image class="art__image" data-variant="any" data-rig-image="" href="${source.src}" x="${x}" y="${y}" width="${sw * scale}" height="${sh * scale}" preserveAspectRatio="xMidYMid meet"/></pattern></defs><rect width="${w}" height="${h}" fill="url(#${paint})"/></g></svg>`;
}
