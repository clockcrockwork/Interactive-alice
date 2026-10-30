/** Shared-master animal cut-outs; source pixels are never changed at runtime. */
import type { ArtStyle } from './treatments.ts';
import { GUINEA_PIG_SVG, PIGEON_SVG, TORTOISE_MASTER_SVG } from './vectors.ts';

interface Layer {
  name: string;
  src: string;
  width: number;
  height: number;
}

interface Part extends Layer {
  className: string;
  pivot: readonly [number, number];
  original: RegExp;
}

interface Rig {
  box: readonly [number, number];
  stage: readonly [number, number];
  footY: number;
  demos: readonly string[];
  original: string;
  base: Layer;
  parts: readonly Part[];
  foregroundParts?: boolean;
  fallbackBodyLast?: boolean;
}

const rigs: Record<string, Rig> = {
  'tortoise-master': {
    box: [200, 240],
    stage: [1145, 1374],
    footY: 1330,
    demos: ['mock-turtle'],
    original: TORTOISE_MASTER_SVG,
    base: {
      name: 'body',
      src: new URL(
        '../../assets/images/generated-layers/tortoise-master~body.any.generated.webp',
        import.meta.url,
      ).href,
      width: 1145,
      height: 1374,
    },
    parts: [
      {
        name: 'cane',
        src: new URL(
          '../../assets/images/generated-layers/tortoise-master~cane.any.generated.webp',
          import.meta.url,
        ).href,
        width: 1145,
        height: 1374,
        className: 'art__cane',
        pivot: [830, 550],
        original: /<g class="art__cane">([\s\S]*?)<\/g>/,
      },
    ],
  },
  'guinea-pig': {
    box: [120, 104],
    stage: [1347, 1168],
    footY: 1089,
    demos: ['witnesses', 'bill-the-lizard'],
    original: GUINEA_PIG_SVG,
    foregroundParts: true,
    base: {
      name: 'body',
      src: new URL(
        '../../assets/images/generated-layers/guinea-pig~body.any.generated.webp',
        import.meta.url,
      ).href,
      width: 1346,
      height: 1168,
    },
    parts: [
      {
        name: 'paw',
        src: new URL(
          '../../assets/images/generated-layers/guinea-pig~paw.any.generated.webp',
          import.meta.url,
        ).href,
        width: 1346,
        height: 1168,
        className: 'guinea-pig__paw',
        pivot: [380, 735],
        original: /<path class="guinea-pig__paw"([^>]*\/>)/,
      },
    ],
  },
  pigeon: {
    box: [260, 200],
    stage: [1430, 1100],
    footY: 1049,
    demos: ['caterpillar'],
    original: PIGEON_SVG,
    fallbackBodyLast: true,
    base: {
      name: 'body',
      src: new URL(
        '../../assets/images/generated-layers/pigeon~body.any.generated.webp',
        import.meta.url,
      ).href,
      width: 1430,
      height: 1100,
    },
    parts: [
      {
        name: 'wing-left',
        src: new URL(
          '../../assets/images/generated-layers/pigeon~wing-left.any.generated.webp',
          import.meta.url,
        ).href,
        width: 1430,
        height: 1100,
        className: 'ct__wing ct__wing--left',
        pivot: [625, 500],
        original: /<g class="ct__wing ct__wing--left">([\s\S]*?)<\/g>/,
      },
      {
        name: 'wing-right',
        src: new URL(
          '../../assets/images/generated-layers/pigeon~wing-right.any.generated.webp',
          import.meta.url,
        ).href,
        width: 1430,
        height: 1100,
        className: 'ct__wing ct__wing--right',
        pivot: [825, 500],
        original: /<g class="ct__wing ct__wing--right">([\s\S]*?)<\/g>/,
      },
    ],
  },
};

/** Only the existing consumers opt in; standalone SVG fragments remain vectors. */
export function generatedAnimalSvg(id: string, style: ArtStyle, demo?: string): string | undefined {
  const rig = rigs[id];
  if (!rig || style !== 'engraved' || !demo || !rig.demos.includes(demo)) return undefined;
  const [w, h] = rig.box;
  const [stageW, stageH] = rig.stage;
  const scale = Math.min(w / stageW, h / stageH);
  const left = (w - stageW * scale) / 2;
  const top = h - rig.footY * scale;
  const image = (layer: Layer): string => {
    // Equal-height edits share one stage. The two 1346-pixel guinea-pig layers
    // are centred on their 1347-pixel reference, never independently stretched.
    const x = left + ((stageW - layer.width) / 2) * scale;
    return `<g data-rig-generated="" visibility="hidden" display="none" data-animal-layer="${layer.name}"><image class="art__image" data-variant="any" data-rig-image="" href="${layer.src}" x="${x}" y="${top}" width="${layer.width * scale}" height="${layer.height * scale}" preserveAspectRatio="xMidYMid meet"/></g>`;
  };
  let body = rig.original.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const parts = rig.parts
    .map((part) => {
      const original = body.match(part.original)?.[0] ?? '';
      body = body.replace(part.original, '');
      // Move the single hook to the group so the original and generated versions
      // animate together without duplicate querySelector targets.
      const fallback = original.startsWith('<path')
        ? original.replace(` class="${part.className}"`, '')
        : original.replace(/^<g[^>]*>/, '').replace(/<\/g>$/, '');
      const pivotX = left + ((stageW - part.width) / 2 + part.pivot[0]) * scale;
      const pivotY = top + part.pivot[1] * scale;
      return `<g class="${part.className}" data-rig-part="" style="--rig-origin: ${pivotX}px ${pivotY}px"><g data-rig-fallback="">${fallback}</g>${image(part)}</g>`;
    })
    .join('');
  const fallbackBody = `<g data-rig-fallback="">${body}</g>`;
  // The cane shoulder and wing roots sit behind their body plates. The paw is
  // in front: behind the body, Bill's +45-degree lift would disappear entirely.
  const drawing = `${rig.fallbackBodyLast ? '' : fallbackBody}${rig.foregroundParts ? image(rig.base) : ''}${parts}${rig.fallbackBodyLast ? fallbackBody : ''}${rig.foregroundParts ? '' : image(rig.base)}`;
  return `<svg viewBox="0 0 ${w} ${h}" focusable="false" data-generated-rig="${id}">${drawing}</svg>`;
}
