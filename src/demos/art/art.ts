/**
 * The characters, as one replaceable layer.
 *
 * Today every figure is a small SVG drawn in code; the plan is retro, engraving-style
 * cut-out illustrations, generated and taken in through the asset-intake skill. So no
 * demo inlines a drawing: it asks for a figure by id (`alice/falling`,
 * `white-rabbit/herald`) and gets a box it can place and animate. What is in the box
 * is the registry's business, and the registry can answer with vector markup today
 * and a cut-out image tomorrow without a demo changing.
 *
 * Contract for an image cut-out, so a generated illustration drops in:
 *   - transparent WebP or AVIF, feet on the bottom edge, centred horizontally;
 *   - one file per Alice variant (blue, yellow) for Alice, one file for anyone else;
 *   - the same aspect box as the vector it replaces, so placement holds.
 * Colour for Alice's two looks comes from tokens for vectors (`--alice-*`) and from
 * a file per variant for images; the page's `data-alice` picks either way.
 */

import { ART, type ArtEntry } from './registry.ts';

export type AliceVariant = 'blue' | 'yellow';

const entryOf = (id: string): ArtEntry => {
  const entry = ART[id];
  if (!entry) {
    throw new Error(`no art registered for ${id}`);
  }
  return entry;
};

/** Which Alice the page is showing; the head script set it before first paint. */
export const aliceVariant = (): AliceVariant =>
  document.documentElement.dataset.alice === 'yellow' ? 'yellow' : 'blue';

/**
 * A figure for an HTML context: a box with the drawing inside. The box carries the
 * id, so a stylesheet can address `[data-art="alice/falling"]` whatever is inside.
 */
export function figure(id: string, className = ''): string {
  const entry = entryOf(id);
  const open = `<span class="art ${className}" data-art="${id}">`;
  if (entry.kind === 'vector') {
    return `${open}${entry.markup}</span>`;
  }
  const images = Object.entries(entry.sources)
    .map(
      ([variant, source]) =>
        `<img class="art__image" data-variant="${variant}" src="${source.src}" width="${source.width}" height="${source.height}" alt="" decoding="async" />`,
    )
    .join('');
  return `${open}${images}</span>`;
}

/**
 * A figure for an SVG context, placed in a box in user units with its feet at
 * (x, y + height) and its centre at x + width / 2.
 */
export function svgFigure(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  className = '',
): string {
  const entry = entryOf(id);
  const open = `<g class="art ${className}" data-art="${id}" transform="translate(${x} ${y})">`;
  if (entry.kind === 'vector') {
    const [boxW, boxH] = entry.box;
    return `${open}<g transform="scale(${width / boxW} ${height / boxH})">${entry.fragment ?? entry.markup}</g></g>`;
  }
  const images = Object.entries(entry.sources)
    .map(
      ([variant, source]) =>
        `<image class="art__image" data-variant="${variant}" href="${source.src}" width="${width}" height="${height}" preserveAspectRatio="xMidYMax meet"/>`,
    )
    .join('');
  return `${open}${images}</g>`;
}

const imageCache = new Map<string, Promise<HTMLImageElement | undefined>>();

/**
 * A figure for a Canvas context: the cut-out image for the current Alice, or
 * nothing, in which case the canvas draws its own vector stand-in. Resolved once.
 */
export function loadArtImage(id: string): Promise<HTMLImageElement | undefined> {
  const entry = ART[id];
  if (entry?.kind !== 'image') {
    return Promise.resolve(undefined);
  }
  const source = entry.sources[aliceVariant()] ?? entry.sources.any;
  if (!source) {
    return Promise.resolve(undefined);
  }
  const key = `${id}:${source.src}`;
  let pending = imageCache.get(key);
  if (!pending) {
    pending = new Promise((resolve) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => resolve(undefined);
      image.src = source.src;
    });
    imageCache.set(key, pending);
  }
  return pending;
}
