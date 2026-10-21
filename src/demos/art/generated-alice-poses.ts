/** Static poses only: never replace a protagonist's independently animated parts. */
import type { AliceVariant } from './art.ts';
import { ART } from './registry.ts';
import type { ArtStyle } from './treatments.ts';

interface PoseSource {
  src: string;
  width: number;
  height: number;
  scale: number;
  x: number;
  y: number;
}

const kneeling = (src: string, floor: number): PoseSource => ({
  src,
  width: 1254,
  height: 1254,
  scale: 230 / 1254,
  x: 0,
  y: 230 - floor * (230 / 1254),
});

const filling = (src: string, height: number, floor: number): PoseSource => {
  // The room deliberately clips the head at its left/top edge. Centre-fit would
  // move the face well inside the room instead of retaining that composition.
  const scale = (330 - 90) / (floor - 340);
  return { src, width: 1851, height, scale, x: 110 - 440 * scale, y: 90 - 340 * scale };
};

const hand = (src: string, width: number): PoseSource => {
  const height = 1619;
  const scale = Math.min(120 / width, 200 / height);
  return { src, width, height, scale, x: (120 - width * scale) / 2, y: 200 - height * scale };
};

const shoulders = (src: string): PoseSource => ({
  src,
  width: 1254,
  height: 1254,
  scale: 0.084,
  // The measured neck ellipse, not the canvas centre, joins the live neck.
  x: 60 - 628 * 0.084,
  y: 52 - 355 * 0.084,
});

const sources: Record<
  string,
  { scenes: readonly string[]; variants: Record<AliceVariant, PoseSource> }
> = {
  'alice/kneeling': {
    scenes: ['rabbit-house'],
    variants: {
      yellow: kneeling(
        new URL(
          '../../assets/images/figures/alice--kneeling.yellow.generated.webp',
          import.meta.url,
        ).href,
        1229,
      ),
      blue: kneeling(
        new URL('../../assets/images/figures/alice--kneeling.blue.generated.webp', import.meta.url)
          .href,
        1230,
      ),
    },
  },
  'alice/filling': {
    scenes: ['rabbit-house'],
    variants: {
      yellow: filling(
        new URL('../../assets/images/figures/alice--filling.yellow.generated.webp', import.meta.url)
          .href,
        849,
        834,
      ),
      blue: filling(
        new URL('../../assets/images/figures/alice--filling.blue.generated.webp', import.meta.url)
          .href,
        850,
        837,
      ),
    },
  },
  'alice/hand-left': {
    scenes: ['caterpillar', 'pig-and-pepper', 'lobster-quadrille'],
    variants: {
      yellow: hand(
        new URL(
          '../../assets/images/figures/alice--hand-left.yellow.generated.webp',
          import.meta.url,
        ).href,
        972,
      ),
      blue: hand(
        new URL('../../assets/images/figures/alice--hand-left.blue.generated.webp', import.meta.url)
          .href,
        972,
      ),
    },
  },
  'alice/hand-right': {
    scenes: ['caterpillar', 'pig-and-pepper', 'lobster-quadrille'],
    variants: {
      yellow: hand(
        new URL(
          '../../assets/images/figures/alice--hand-right.yellow.generated.webp',
          import.meta.url,
        ).href,
        971,
      ),
      blue: hand(
        new URL(
          '../../assets/images/figures/alice--hand-right.blue.generated.webp',
          import.meta.url,
        ).href,
        971,
      ),
    },
  },
  'alice/from-above': {
    scenes: ['caterpillar'],
    variants: {
      yellow: shoulders(
        new URL(
          '../../assets/images/figures/alice--from-above.yellow.generated.webp',
          import.meta.url,
        ).href,
      ),
      blue: shoulders(
        new URL(
          '../../assets/images/figures/alice--from-above.blue.generated.webp',
          import.meta.url,
        ).href,
      ),
    },
  },
};

let serial = 0;

/** Fixed paint boxes preserve pivots before and after the atomic decode switch. */
export function generatedAlicePoseSvg(
  id: string,
  style: ArtStyle,
  demo: string | undefined,
  variant: AliceVariant,
): string | undefined {
  const pose = sources[id];
  const entry = ART[id];
  if (
    !pose ||
    entry?.kind !== 'vector' ||
    style !== 'engraved' ||
    !demo ||
    !pose.scenes.includes(demo)
  )
    return undefined;
  const source = pose.variants[variant];
  const [w, h] = entry.box;
  const name = `alice-pose-${++serial}`;
  const original =
    entry.fragment ?? entry.markup.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const pattern = (suffix: string, content: string): string =>
    `<pattern id="${name}-${suffix}" width="${w}" height="${h}" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse" overflow="hidden">${content}</pattern>`;
  const paint = (suffix: string): string =>
    `<rect width="${w}" height="${h}" fill="url(#${name}-${suffix})"/>`;
  const image = `<image class="art__image" data-variant="${variant}" data-rig-image="" href="${source.src}" x="${source.x}" y="${source.y}" width="${source.width * source.scale}" height="${source.height * source.scale}" preserveAspectRatio="xMidYMid meet"/>`;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" focusable="false" data-generated-rig="${id}"><defs>${pattern('original', original)}${pattern('generated', image)}</defs><g data-rig-fallback="">${paint('original')}</g><g data-rig-generated="" visibility="hidden" display="none">${paint('generated')}</g></svg>`;
}
