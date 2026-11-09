import { ART, type ImageSource } from '../art/registry.ts';
import { type ArtStyle, artStyle } from '../art/treatments.ts';
import type { Swimmer } from './sea.ts';

type Variant = 'yellow' | 'blue';
type Kind = Swimmer['kind'];

interface Placement {
  /** Source-pixel position of the local waterline origin, not a foot anchor. */
  centreX: number;
  waterlineY: number;
  /** Uniform scale: natural anatomy must never be stretched into the old oval. */
  scale: number;
}

export interface SwimmingComposition extends Placement {
  source: ImageSource;
}

/** Measured against the existing unmodified cutouts; lower legs stay submerged. */
const ANIMALS: Record<Exclude<Kind, 'alice'>, Placement> = {
  mouse: { centreX: 710, waterlineY: 975, scale: 114 / 1164 },
  duck: { centreX: 560, waterlineY: 950, scale: 80 / 1165 },
  dodo: { centreX: 500, waterlineY: 1050, scale: 88 / 1164 },
  lory: { centreX: 560, waterlineY: 950, scale: 80 / 1164 },
  eaglet: { centreX: 560, waterlineY: 950, scale: 82 / 1166 },
  magpie: { centreX: 560, waterlineY: 960, scale: 82 / 1164 },
  crab: { centreX: 192, waterlineY: 153, scale: 82 / 384 },
};

const ALICE: Partial<Record<Variant, SwimmingComposition>> = {
  yellow: {
    source: {
      src: new URL(
        '../../assets/images/figures/alice--swimming.yellow.generated.webp',
        import.meta.url,
      ).href,
      width: 1254,
      height: 1254,
    },
    centreX: 630,
    waterlineY: 975,
    scale: 72 / 1254,
  },
  blue: {
    source: {
      src: new URL(
        '../../assets/images/figures/alice--swimming.blue.generated.webp',
        import.meta.url,
      ).href,
      width: 1254,
      height: 1254,
    },
    centreX: 630,
    waterlineY: 975,
    scale: 72 / 1254,
  },
};

export function swimmingComposition(
  kind: Kind,
  style: ArtStyle,
  variant: Variant,
): SwimmingComposition | undefined {
  if (style !== 'engraved') return undefined;
  if (kind === 'alice') return ALICE[variant];
  const entry = ART[`runner/${kind}`];
  const source = entry?.kind === 'vector' ? entry.generated?.any : undefined;
  return source ? { source, ...ANIMALS[kind] } : undefined;
}

const KINDS: readonly Kind[] = [
  'mouse',
  'alice',
  'duck',
  'dodo',
  'lory',
  'eaglet',
  'crab',
  'magpie',
];
const cache = new Map<string, Promise<HTMLImageElement | undefined>>();

/** One load/decode per URL, including failures. No I/O happens in a draw call. */
function load(source: ImageSource): Promise<HTMLImageElement | undefined> {
  let pending = cache.get(source.src);
  if (!pending) {
    pending = new Promise((resolve) => {
      const image = new Image();
      image.decoding = 'async';
      const finish = (value: HTMLImageElement | undefined): void => {
        image.onload = null;
        image.onerror = null;
        resolve(value);
      };
      image.onerror = () => finish(undefined);
      image.onload = () => {
        void image.decode().then(
          () => finish(image.naturalWidth > 0 && image.naturalHeight > 0 ? image : undefined),
          () => finish(undefined),
        );
      };
      image.src = source.src;
    });
    cache.set(source.src, pending);
  }
  return pending;
}

/** Nine live tufts follow the actual generated back contour, not its empty canvas. */
const MOUSE_BACK = [
  [310, 787],
  [360, 742],
  [410, 716],
  [460, 696],
  [510, 689],
  [560, 684],
  [610, 691],
  [660, 705],
  [710, 716],
] as const;

export function createSwimmingArt(connected: () => boolean) {
  let selection = '';
  let generation = 0;
  const ready = new Map<Kind, { image: HTMLImageElement; composition: SwimmingComposition }>();

  const select = (): void => {
    const style = artStyle();
    const variant = document.documentElement.dataset.alice === 'blue' ? 'blue' : 'yellow';
    const next = `${style}:${variant}`;
    if (next === selection) return;
    selection = next;
    const current = ++generation;
    ready.clear();
    for (const kind of KINDS) {
      const composition = swimmingComposition(kind, style, variant);
      if (!composition) continue;
      void load(composition.source).then((image) => {
        // A previous appearance or a detached scene never publishes late artwork.
        if (image && current === generation && connected()) ready.set(kind, { image, composition });
      });
    }
  };
  select();

  return {
    /** Appearance changes are infrequent; repeating this does not initiate loads. */
    select,
    draw(ctx: CanvasRenderingContext2D, swimmer: Swimmer, waterline: number, ink: string): boolean {
      const loaded = ready.get(swimmer.kind);
      if (!loaded || !connected()) return false;
      const { image, composition } = loaded;
      const { source, centreX, waterlineY, scale } = composition;
      const x = -centreX * scale;
      const y = -waterlineY * scale;
      // The water cut is in source space. A leap exposes the complete Mouse,
      // while a swimmer's legs do not look as though they stand on the water.
      const cut = Math.max(0, Math.min(source.height, waterlineY + waterline / scale));
      if (cut > 0)
        ctx.drawImage(image, 0, 0, source.width, cut, x, y, source.width * scale, cut * scale);
      const below = Math.min(source.height - cut, 4 / scale);
      if (below > 0) {
        ctx.save();
        ctx.globalAlpha *= 0.28;
        ctx.drawImage(
          image,
          0,
          cut,
          source.width,
          below,
          x,
          y + cut * scale,
          source.width * scale,
          below * scale,
        );
        ctx.restore();
      }
      if (swimmer.kind === 'mouse' && swimmer.bristle > 0.01) {
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2;
        for (const [px, py] of MOUSE_BACK) {
          const bx = (px - centreX) * scale;
          const by = (py - waterlineY) * scale;
          ctx.beginPath();
          ctx.moveTo(bx, by + 1);
          ctx.lineTo(bx + 2, by - 14 * swimmer.bristle);
          ctx.stroke();
        }
      }
      return true;
    },
  };
}
