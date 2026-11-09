/** Articulated cut-outs with unchanged source pixels and original motion boxes. */
import type { ArtStyle } from './treatments.ts';
import { BILL_FRAGMENT, CATERPILLAR_SVG } from './vectors.ts';

const urls = {
  catBody: new URL(
    '../../assets/images/generated-layers/caterpillar~body.any.generated.webp',
    import.meta.url,
  ).href,
  catHead: new URL(
    '../../assets/images/generated-layers/caterpillar~head.any.generated.webp',
    import.meta.url,
  ).href,
  hookah: new URL(
    '../../assets/images/generated-layers/caterpillar~hookah.any.generated.webp',
    import.meta.url,
  ).href,
  billBody: new URL(
    '../../assets/images/generated-layers/bill~body.any.generated.webp',
    import.meta.url,
  ).href,
  billHead: new URL(
    '../../assets/images/generated-layers/bill~head.any.generated.webp',
    import.meta.url,
  ).href,
};

let sequence = 0;
const fallback = (markup: string): string => `<g data-rig-fallback="">${markup}</g>`;
const generated = (markup: string): string =>
  `<g data-rig-generated="" visibility="hidden" display="none">${markup}</g>`;
const inner = (svg: string): string => svg.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const image = (src: string, x: number, y: number, width: number, height: number): string =>
  `<image class="art__image" data-variant="any" data-rig-image="" href="${src}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>`;
function takeGroup(markup: string, name: string): { content: string; rest: string } {
  const match = markup.match(new RegExp(`<g class="${name}">([\\s\\S]*?)<\\/g>`));
  if (!match) throw new Error(`missing articulated group ${name}`);
  return { content: match[1] ?? '', rest: markup.replace(match[0], '') };
}

export interface Point {
  x: number;
  y: number;
}
export interface Affine {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}
const identity: Affine = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
const catScale = 270 / 1374;
const catTop = 200 - 1106 * catScale;
const catMouth: Point = {
  x: (1280 * 0.94 + 36.6) * catScale,
  y: catTop + (392 * 0.94 + 44) * catScale,
};
const catPort: Point = { x: 1235 * catScale, y: catTop + 800 * catScale };
const transform = (point: Point, m: Affine): Point => ({
  x: m.a * point.x + m.c * point.y + m.e,
  y: m.b * point.x + m.d * point.y + m.f,
});
const n = (value: number): string => value.toFixed(3);

/** The mouth moves; the hookah end stays put. This does not change any raster. */
export function caterpillarHosePath(matrix: Affine = identity): string {
  const mouth = transform(catMouth, matrix);
  return `M${n(mouth.x)} ${n(mouth.y)} C${n(mouth.x + 160 * catScale)} ${n(mouth.y + 75 * catScale)} ${n(1440 * catScale)} ${n(catTop + 710 * catScale)} ${n(catPort.x)} ${n(catPort.y)}`;
}

function caterpillar(): string {
  const id = `art-caterpillar-head-${++sequence}`;
  const body = takeGroup(inner(CATERPILLAR_SVG), 'ct__body');
  const head = takeGroup(body.rest, 'ct__head');
  const hose = caterpillarHosePath();
  const hosePaths = `<path data-caterpillar-hose="" d="${hose}" fill="none" stroke="#49321f" stroke-width="${24 * catScale}" stroke-linecap="round"/><path data-caterpillar-hose="" d="${hose}" fill="none" stroke="#a1653c" stroke-width="${17 * catScale}" stroke-linecap="round"/><path data-caterpillar-hose="" d="${hose}" fill="none" stroke="#d0a17a" stroke-width="${5 * catScale}" stroke-dasharray="${2 * catScale} ${8 * catScale}"/>`;
  // The paint rectangle is the original head's stroke-inclusive box. GSAP's
  // 30% 80% and the peek's 20% 90% origins never see a padded raster canvas.
  const headPaint = `<defs><pattern id="${id}" y="-50" width="300" height="300" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse">${image(urls.catHead, 36.6 * catScale, catTop + 44 * catScale + 50, 1374 * catScale * 0.94, 1145 * catScale * 0.94)}</pattern></defs><rect data-caterpillar-head-box="" x="173.5" y="-2.5" width="85.5" height="103.5" fill="url(#${id})"/>`;
  const drawing = `<g class="ct__body">${fallback(body.content)}${generated(image(urls.catBody, 0, catTop, 270, 225))}</g>${generated(hosePaths)}${fallback(head.rest)}${generated(image(urls.hookah, 0, catTop, 270, 225))}<g class="ct__head">${fallback(head.content)}${generated(headPaint)}</g>`;
  return `<svg viewBox="0 0 240 200" focusable="false" data-generated-rig="caterpillar">${drawing}</svg>`;
}

const billScale = 115 / 1374;
const billTop = 100 - 1065 * billScale;
const billPivot: Point = { x: 1 + 900 * billScale, y: billTop + 720 * billScale };
const billAnchor: Point = { x: 1 + 1185 * billScale, y: billTop + 503 * billScale };

/** Scene prop anchor in logical units; the caller keeps its whole-body rotation. */
export function generatedBillHeadAnchor(ready: boolean, degrees: number): Point | undefined {
  if (!ready) return undefined;
  const angle = (degrees * Math.PI) / 180;
  const x = billAnchor.x - billPivot.x;
  const y = billAnchor.y - billPivot.y;
  return {
    x: billPivot.x + x * Math.cos(angle) - y * Math.sin(angle),
    y: billPivot.y + x * Math.sin(angle) + y * Math.cos(angle),
  };
}

function bill(): string {
  const key = ++sequence;
  const paintId = `art-bill-paint-${key}`;
  const headId = `art-bill-head-${key}`;
  const colorId = `art-bill-color-${key}`;
  const head = takeGroup(BILL_FRAGMENT, 'bill__head');
  const tint = (markup: string): string => `<g filter="url(#${colorId})">${markup}</g>`;
  const headPlate = image(
    urls.billHead,
    1 + 195 * billScale,
    billTop + 28 * billScale,
    1374 * billScale * 0.88,
    1145 * billScale * 0.88,
  );
  // One definition gives both fallback and painted rig the same selector. The
  // fixed paint rectangle keeps transparent source padding out of House pivots.
  const defs = `<defs><filter id="${colorId}" color-interpolation-filters="sRGB"><feFlood flood-color="var(--bl-lizard, #9c9169)" flood-opacity="0.3"/><feComposite in2="SourceGraphic" operator="in"/><feBlend in="SourceGraphic" mode="multiply"/></filter><g id="${headId}" class="bill__head" data-rig-part="" style="--rig-origin: ${billPivot.x}px ${billPivot.y}px">${fallback(head.content)}${generated(tint(headPlate))}</g><pattern id="${paintId}" width="120" height="100" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse">${tint(image(urls.billBody, 1, billTop, 115, 1145 * billScale))}<use href="#${headId}"/></pattern></defs>`;
  return `<svg viewBox="0 0 120 100" focusable="false" data-generated-rig="bill">${defs}${fallback(`${head.rest}<use href="#${headId}"/>`)}${generated(`<rect data-bill-paint-box="" width="120" height="100" fill="url(#${paintId})"/>`)}</svg>`;
}

/** Only verified consumers opt in; the registry's global fallback stays intact. */
export function generatedCaterpillarBillSvg(
  id: string,
  style: ArtStyle,
  demo?: string,
): string | undefined {
  if (style !== 'engraved' || !demo) return undefined;
  if (id === 'caterpillar' && demo === 'caterpillar') return caterpillar();
  if (
    id === 'bill' &&
    (demo === 'bill-the-lizard' || demo === 'rabbit-house' || demo === 'witnesses')
  )
    return bill();
  return undefined;
}

/** Runs inside the scene's existing paused/teardown-owned frame callback. */
export function createCaterpillarHoseSync(root: ParentNode): () => void {
  const rigs = [
    ...root.querySelectorAll<SVGSVGElement>('svg[data-generated-rig="caterpillar"]'),
  ].map((svg) => ({
    svg,
    head: svg.querySelector<SVGGElement>('.ct__head'),
    paths: [...svg.querySelectorAll<SVGPathElement>('[data-caterpillar-hose]')],
    last: '',
  }));
  return () => {
    for (const rig of rigs) {
      if (!rig.svg.isConnected || !rig.svg.hasAttribute('data-rig-ready') || !rig.head) continue;
      const rootMatrix = rig.svg.getCTM();
      const headMatrix = rig.head.getCTM();
      if (!rootMatrix || !headMatrix) continue;
      let matrix: DOMMatrix;
      try {
        matrix = rootMatrix.inverse().multiply(headMatrix);
      } catch {
        continue;
      }
      if (![matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f].every(Number.isFinite))
        continue;
      const path = caterpillarHosePath(matrix);
      if (path === rig.last) continue;
      for (const element of rig.paths) element.setAttribute('d', path);
      rig.last = path;
    }
  };
}

/** Explicit viewport dimensions avoid nested-SVG percentage sizing in the House. */
export function generatedBillFragment(style: ArtStyle, demo?: string): string | undefined {
  const svg = generatedCaterpillarBillSvg('bill', style, demo);
  return svg?.replace('<svg ', '<svg width="120" height="100" overflow="visible" ');
}
