/** Three pip counts share one body and one live painting arm. */
import type { ArtStyle } from './treatments.ts';
import { gardenerSvg } from './vectors.ts';

const base = new URL(
  '../../assets/images/generated-layers/gardener~base.any.generated.webp',
  import.meta.url,
).href;
const brush = new URL(
  '../../assets/images/generated-layers/gardener~brush.any.generated.webp',
  import.meta.url,
).href;
const counts: Record<string, number> = {
  'gardener/two': 2,
  'gardener/five': 5,
  'gardener/seven': 7,
};
const hidden = (s: string): string =>
  `<g data-rig-generated="" visibility="hidden" display="none">${s}</g>`;

export function generatedGardenerSvg(
  id: string,
  style: ArtStyle,
  demo?: string,
): string | undefined {
  const pips = counts[id];
  if (!pips || style !== 'engraved' || demo !== 'croquet') return undefined;
  const original = gardenerSvg(pips)
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
  const arm = original.match(/<g class="cq__brush">([\s\S]*?)<\/g>/)?.[1] ?? '';
  const body = original.replace(/<g class="cq__brush">[\s\S]*?<\/g>/, '');
  const spots = [...body.matchAll(/<path d="M(?:44|76) \d+ l7 -10[^>]*\/>/g)]
    .map((m) => m[0])
    .join('');
  const scale = 220 / 1699;
  const top = 220 - 1646 * scale;
  const image = (src: string, x: number, y: number, width: number, height: number): string =>
    `<image class="art__image" data-variant="any" data-rig-image="" href="${src}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>`;
  return `<svg viewBox="0 0 120 220" focusable="false" data-generated-rig="${id}"><g data-rig-fallback="">${body}</g><g class="cq__brush" data-rig-part="" style="--rig-origin: ${690 * scale}px ${top + 480 * scale}px"><g data-rig-fallback="">${arm}</g>${hidden(image(brush, 540 * scale, top + 30 * scale, 463 * scale, 849.5 * scale))}</g>${hidden(image(base, 0, top, 926 * scale, 1698 * scale))}${hidden(`<g data-gardener-pips="${pips}" transform="matrix(.9 0 0 .8 0 -10)">${spots}</g>`)}</svg>`;
}
