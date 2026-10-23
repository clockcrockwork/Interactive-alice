/** Keep the twelve live slates; only the jurors and bench are generated. */
import type { ArtStyle } from './treatments.ts';
import { JURY_SVG } from './vectors.ts';

const image = new URL('../../assets/images/figures/jury.any.generated.webp', import.meta.url).href;

export function generatedJurySvg(id: string, style: ArtStyle, demo?: string): string | undefined {
  if (id !== 'jury' || style !== 'engraved' || (demo !== 'trial' && demo !== 'witnesses'))
    return undefined;
  const original = JURY_SVG.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const slates = [...original.matchAll(/<g class="tr__slate"[\s\S]*?<\/g>/g)];
  const decoration = original.replace(/<g class="tr__slate"[\s\S]*?<\/g>/g, '');
  const scale = 480 / 1852;
  const top = 220 - 780 * scale;
  return `<svg viewBox="0 0 480 220" focusable="false" data-generated-rig="jury"><g data-rig-fallback="">${decoration}</g><g data-rig-generated="" visibility="hidden" display="none"><image class="art__image" data-variant="any" data-rig-image="" href="${image}" x="0" y="${top}" width="480" height="${849 * scale}" preserveAspectRatio="xMidYMid meet"/></g>${slates.map((slate, i) => `<g data-rig-map="" style="--rig-map: translateY(${i % 2 === 0 ? 24 : 10}px)">${slate[0]}</g>`).join('')}</svg>`;
}
