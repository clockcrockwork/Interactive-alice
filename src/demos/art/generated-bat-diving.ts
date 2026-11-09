/** Scene-specific maps for wings and scrabbling feet, with complete vector fallbacks. */
import type { ArtStyle } from './treatments.ts';
import { BAT_SVG, RABBIT_DIVING_SVG } from './vectors.ts';

const batBody = new URL(
  '../../assets/images/generated-layers/bat~body.any.generated.webp',
  import.meta.url,
).href;
const batLeft = new URL(
  '../../assets/images/generated-layers/bat~wing-left.any.generated.webp',
  import.meta.url,
).href;
const batRight = new URL(
  '../../assets/images/generated-layers/bat~wing-right.any.generated.webp',
  import.meta.url,
).href;
const rabbitBody = new URL(
  '../../assets/images/generated-layers/white-rabbit~diving-body.any.generated.webp',
  import.meta.url,
).href;
const rabbitLeft = new URL(
  '../../assets/images/generated-layers/white-rabbit~diving-foot-left.any.generated.webp',
  import.meta.url,
).href;
const rabbitRight = new URL(
  '../../assets/images/generated-layers/white-rabbit~diving-foot-right.any.generated.webp',
  import.meta.url,
).href;

const inside = (svg: string): string =>
  svg.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const fallback = (markup: string): string => `<g data-rig-fallback="">${markup}</g>`;
const image = (src: string, width: number, height: number, map: string): string =>
  `<g data-rig-generated="" visibility="hidden" display="none"><g transform="${map}"><image class="art__image" data-variant="any" data-rig-image="" href="${src}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/></g></g>`;

function batSvg(demo: string): string | undefined {
  const original = inside(BAT_SVG);
  const left = original.match(/<path class="rh__wing"[^>]*\/>/);
  const right = original.match(/<path class="rh__wing rh__wing--right"[^>]*\/>/);
  if (!left || !right) return undefined;
  const body = original.replace(left[0], '').replace(right[0], '');
  const leftOrigin = demo === 'tea-party' ? '49.3px 20.8px' : '50px 25px';
  const rightOrigin = demo === 'tea-party' ? '50px 20.8px' : '50px 25px';
  const wing = (
    source: string,
    className: string,
    src: string,
    map: string,
    origin: string,
  ): string =>
    `<g class="${className}" data-rig-part="" style="--rig-origin: ${origin}">${fallback(source.replace(/ class="[^"]*"/, ''))}${image(src, 1774, 887, map)}</g>`;
  return `<svg width="100" height="50" viewBox="0 0 100 50" focusable="false" data-generated-rig="bat">${wing(left[0], 'rh__wing', batLeft, 'matrix(0.05 0 0 0.05 2 0)', leftOrigin)}${wing(right[0], 'rh__wing rh__wing--right', batRight, 'matrix(0.044 0 0 0.044 21 1)', rightOrigin)}${fallback(body)}${image(batBody, 1774, 887, 'matrix(0.0385 0 0 0.0385 15.8505 5.8)')}</svg>`;
}

function divingSvg(): string | undefined {
  const original = inside(RABBIT_DIVING_SVG);
  const left = original.match(/<g data-part="foot-left">([\s\S]*?)<\/g>/);
  const right = original.match(/<g data-part="foot-right">([\s\S]*?)<\/g>/);
  if (!left || !right) return undefined;
  const body = original.replace(left[0], '').replace(right[0], '');
  // Geometry of the original +/-34-degree ellipse, excluding stroke. SVG's
  // default fill-box uses that box, not the transparent raster canvas.
  const angle = (34 * Math.PI) / 180;
  const halfHeight = Math.hypot(9 * Math.sin(angle), 17 * Math.cos(angle));
  const originY = 80 + 0.8 * halfHeight;
  const foot = (source: string, side: string, src: string, map: string, x: number): string =>
    `<g data-part="foot-${side}" data-rig-part="" style="--rig-origin: ${x}px ${originY}px">${fallback(source)}${image(src, 1254, 1254, map)}</g>`;
  return `<svg width="100" height="100" viewBox="0 0 100 100" focusable="false" data-generated-rig="diving-rabbit">${foot(left[1] ?? '', 'left', rabbitLeft, 'matrix(0.065 0 0 0.065 1 20)', 22)}${foot(right[1] ?? '', 'right', rabbitRight, 'matrix(0.075 0 0 0.075 6 10)', 78)}${fallback(body)}${image(rabbitBody, 1254, 1254, 'matrix(0.07 0 0 0.07 4.15 32)')}</svg>`;
}

/** Explicit dimensions also make this root safe inside svgFigure's scaling group. */
export function generatedBatDivingSvg(
  id: string,
  style: ArtStyle,
  demo?: string,
): string | undefined {
  if (style !== 'engraved') return undefined;
  if (id === 'bat' && (demo === 'rabbit-hole' || demo === 'tea-party')) return batSvg(demo);
  if (id === 'white-rabbit/diving' && demo === 'riverbank') return divingSvg();
  return undefined;
}
