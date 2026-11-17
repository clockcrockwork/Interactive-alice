/** Intact glass-table cutout; the live key and all sea compositing stay in sea.ts. */
import { type ArtStyle, artStyle } from '../art/treatments.ts';

export const POOL_TABLE_SOURCE = {
  src: new URL('../../assets/images/figures/pool-glass-table.any.generated.webp', import.meta.url)
    .href,
  width: 1254,
  height: 1254,
} as const;

/** Measured top width and centre in the unchanged source canvas, in pixels. */
export const POOL_TABLE_ANCHOR = { centreX: 627, topCentreY: 366, topWidth: 1192 } as const;

export function poolTableComposition(unit: number, tx: number, ty: number) {
  const scale = (unit * 0.11) / POOL_TABLE_ANCHOR.topWidth;
  // Match the original top's width and key plane, not the transparent margins.
  // One scale preserves the generated oval and all four legs without distortion.
  const keyY = ty - unit * 0.06 * 0.9 + unit * 0.05 * 0.5;
  return {
    x: tx - POOL_TABLE_ANCHOR.centreX * scale,
    y: keyY - POOL_TABLE_ANCHOR.topCentreY * scale,
    width: POOL_TABLE_SOURCE.width * scale,
    height: POOL_TABLE_SOURCE.height * scale,
    scale,
  };
}

let pending: Promise<HTMLImageElement | undefined> | undefined;

/** Cache a failed load too, so a missing cutout cannot retry on every frame. */
function load(): Promise<HTMLImageElement | undefined> {
  pending ??= new Promise((resolve) => {
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
        () =>
          finish(
            image.naturalWidth === POOL_TABLE_SOURCE.width &&
              image.naturalHeight === POOL_TABLE_SOURCE.height
              ? image
              : undefined,
          ),
        () => finish(undefined),
      );
    };
    image.src = POOL_TABLE_SOURCE.src;
  });
  return pending;
}

export function createGlassTableArt(connected: () => boolean) {
  let selection: ArtStyle | undefined;
  let generation = 0;
  let ready: HTMLImageElement | undefined;
  const select = (): void => {
    const next = artStyle();
    if (next === selection) return;
    selection = next;
    const current = ++generation;
    ready = undefined;
    if (next !== 'engraved') return;
    void load().then((image) => {
      if (current === generation && connected()) ready = image;
    });
  };
  select();
  return {
    select,
    draw(ctx: CanvasRenderingContext2D, unit: number, tx: number, ty: number): boolean {
      if (!ready || !connected()) return false;
      const box = poolTableComposition(unit, tx, ty);
      // Full source canvas, no source rectangle, crop, remask or nonuniform scale.
      ctx.drawImage(ready, box.x, box.y, box.width, box.height);
      return true;
    },
  };
}
