/** Separate waist-bowing upper bodies and alternate wigs for the household pair. */
import type { ArtStyle } from './treatments.ts';
import { footmanSvg } from './vectors.ts';

type Kind = 'fish' | 'frog';
type Part = 'legs' | 'body' | 'curls' | 'tangle';
interface Layer {
  src: string;
  size: readonly [number, number];
  map: readonly [number, number, number];
}
interface Rig {
  footY: number;
  waist: readonly [number, number];
  layers: Record<Part, Layer>;
}

const rigs: Record<Kind, Rig> = {
  fish: {
    footY: 1630,
    waist: [475, 1045],
    layers: {
      legs: {
        src: new URL(
          '../../assets/images/generated-layers/fish-footman~legs.any.generated.webp',
          import.meta.url,
        ).href,
        size: [926, 1699],
        map: [82, 354, 0.82],
      },
      body: {
        src: new URL(
          '../../assets/images/generated-layers/fish-footman~body.any.generated.webp',
          import.meta.url,
        ).href,
        size: [926, 1699],
        map: [84, 75, 0.78],
      },
      curls: {
        src: new URL(
          '../../assets/images/generated-layers/fish-footman~curls.any.generated.webp',
          import.meta.url,
        ).href,
        size: [926, 1699],
        map: [152, -30, 0.67],
      },
      tangle: {
        src: new URL(
          '../../assets/images/generated-layers/fish-footman~tangle.any.generated.webp',
          import.meta.url,
        ).href,
        size: [926, 1699],
        map: [232, -186, 0.53],
      },
    },
  },
  frog: {
    footY: 1646,
    waist: [466, 1005],
    layers: {
      legs: {
        src: new URL(
          '../../assets/images/generated-layers/frog-footman~legs.any.generated.webp',
          import.meta.url,
        ).href,
        size: [926, 1699],
        map: [178, 685, 0.6],
      },
      body: {
        src: new URL(
          '../../assets/images/generated-layers/frog-footman~body.any.generated.webp',
          import.meta.url,
        ).href,
        size: [926, 1699],
        map: [119, 72, 0.75],
      },
      curls: {
        src: new URL(
          '../../assets/images/generated-layers/frog-footman~curls.any.generated.webp',
          import.meta.url,
        ).href,
        size: [926, 1699],
        map: [133, -30, 0.71],
      },
      tangle: {
        src: new URL(
          '../../assets/images/generated-layers/frog-footman~tangle.any.generated.webp',
          import.meta.url,
        ).href,
        size: [926, 1699],
        map: [164, -95, 0.66],
      },
    },
  },
};

const fallback = (markup: string): string => `<g data-rig-fallback="">${markup}</g>`;

/** Extract only known project-owned groups, preserving their nested hierarchy. */
function takeGroup(markup: string, className: string): { rest: string; content: string } {
  const start = markup.indexOf(`<g class="${className}"`);
  if (start < 0) throw new Error(`missing footman group ${className}`);
  const tags = /<\/?g\b[^>]*>/g;
  tags.lastIndex = start;
  let depth = 0;
  let contentStart = start;
  for (let tag = tags.exec(markup); tag; tag = tags.exec(markup)) {
    if (tag[0].startsWith('</')) depth--;
    else {
      depth++;
      if (depth === 1) contentStart = tags.lastIndex;
    }
    if (depth === 0)
      return {
        rest: markup.slice(0, start) + markup.slice(tags.lastIndex),
        content: markup.slice(contentStart, tag.index),
      };
  }
  throw new Error(`unclosed footman group ${className}`);
}

/** Keep non-consuming scenes, other treatments and inline fragments unchanged. */
export function generatedFootmanSvg(
  id: string,
  style: ArtStyle,
  demo?: string,
): string | undefined {
  if (style !== 'engraved' || demo !== 'pig-and-pepper') return undefined;
  if (id !== 'fish-footman' && id !== 'frog-footman') return undefined;
  const kind: Kind = id === 'fish-footman' ? 'fish' : 'frog';
  const rig = rigs[kind];
  const scale = 120 / 926;
  const top = 216 - rig.footY * scale;
  const image = (part: Part): string => {
    const {
      src,
      size: [w, h],
      map: [x, y, s],
    } = rig.layers[part];
    return `<g data-rig-generated="" visibility="hidden" display="none" data-footman-layer="${part}"><image class="art__image" data-variant="any" data-rig-image="" href="${src}" x="${x * scale}" y="${top + y * scale}" width="${w * s * scale}" height="${h * s * scale}" preserveAspectRatio="xMidYMid meet"/></g>`;
  };
  const original = footmanSvg(kind)
    .replace(/^\s*<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
  const body = takeGroup(original, 'pp__body');
  const curls = takeGroup(body.content, 'pp__curls');
  const tangle = curls.rest.match(/<path class="pp__tangle"[^>]*\/>/)?.[0];
  if (!tangle) throw new Error('missing footman tangle');
  const bodyDrawing = fallback(curls.rest.replace(tangle, '')) + image('body');
  const wigs = `<g class="pp__curls">${fallback(curls.content)}${image('curls')}</g><g class="pp__tangle">${fallback(tangle.replace(' class="pp__tangle"', ''))}${image('tangle')}</g>`;
  // The fixed breeches stay outside the upper-body transform. Only a ready rig
  // uses its measured waist pivot; fallback fill-box and all old shapes survive.
  const drawing = `${fallback(body.rest)}${image('legs')}<g class="pp__body" data-rig-part="" style="--rig-origin: ${rig.waist[0] * scale}px ${top + rig.waist[1] * scale}px">${bodyDrawing}${wigs}</g>`;
  return `<svg viewBox="0 0 120 220" focusable="false" data-generated-rig="${id}">${drawing}</svg>`;
}
