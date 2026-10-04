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
 *
 * The drawing trial (docs/art-trials.md) proves that contract today: in the pictures
 * style (`data-art="baked"`) a vector entry with a baked picture (baked.ts) gets the
 * picture beside its vector, and art.css shows one.
 */

import { BAKED } from './baked.ts';
import { ART, type ArtEntry, type ImageSource, LIVE_PARTS } from './registry.ts';
import { type ArtStyle, artStyle } from './treatments.ts';

export type AliceVariant = 'blue' | 'yellow';
type Sources = Partial<Record<AliceVariant | 'any', ImageSource>>;

/** Outside a browser (the build renders the index) the drawing is flat. */
const inBrowser = typeof document !== 'undefined';
const pageStyle = (): ArtStyle => (inBrowser ? artStyle() : 'flat');
const pageDemo = (): string | undefined => (inBrowser ? document.body?.dataset.demo : undefined);

const entryOf = (id: string): ArtEntry => {
  const entry = ART[id];
  if (!entry) {
    throw new Error(`no art registered for ${id}`);
  }
  return entry;
};

/** Which Alice the page is showing; the head script set it before first paint. */
export const aliceVariant = (): AliceVariant =>
  document.documentElement.dataset.alice === 'blue' ? 'blue' : 'yellow';

/**
 * The baked pictures a figure shows, if any: only when the page shows pictures, a
 * picture was baked for it, and the demo does not move the figure's own parts.
 */
export function bakedFor(
  id: string,
  style: ArtStyle = pageStyle(),
  demo: string | undefined = pageDemo(),
): Sources | undefined {
  const sources = BAKED[id];
  if (!sources || style !== 'baked' || (demo && LIVE_PARTS[id]?.includes(demo))) {
    return undefined;
  }
  // A page keeps its Alice (the choice is made on the index), so in a browser only
  // her picture is put on it: a hidden <img> would still be fetched.
  if (inBrowser && !sources.any) {
    const variant = aliceVariant();
    return { [variant]: sources[variant] };
  }
  return sources;
}

const imgTags = (sources: Sources, className: string): string =>
  Object.entries(sources)
    .map(
      ([variant, source]) =>
        `<img class="${className}" data-variant="${variant}" src="${source.src}" width="${source.width}" height="${source.height}" alt="" decoding="async" />`,
    )
    .join('');

const imageTags = (sources: Sources, className: string, width: number, height: number): string =>
  Object.entries(sources)
    .map(
      ([variant, source]) =>
        `<image class="${className}" data-variant="${variant}" href="${source.src}" width="${width}" height="${height}" preserveAspectRatio="xMidYMax meet"/>`,
    )
    .join('');

/**
 * A figure for an HTML context: a box with the drawing inside. The box carries the
 * id, so a stylesheet can address `[data-art="alice/falling"]` whatever is inside.
 */
export function figure(id: string, className = '', style: ArtStyle = pageStyle()): string {
  const entry = entryOf(id);
  if (entry.kind === 'vector') {
    // A baked picture rides beside the vector; art.css shows one by `data-art`.
    const baked = bakedFor(id, style);
    if (baked) {
      return `<span class="art art--baked ${className}" data-art="${id}">${entry.markup}${imgTags(baked, 'art__image art__image--baked')}</span>`;
    }
    return `<span class="art ${className}" data-art="${id}">${entry.markup}</span>`;
  }
  return `<span class="art ${className}" data-art="${id}">${imgTags(entry.sources, 'art__image')}</span>`;
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
  const at = `data-art="${id}" transform="translate(${x} ${y})"`;
  if (entry.kind === 'vector') {
    const [boxW, boxH] = entry.box;
    const drawing = `<g transform="scale(${width / boxW} ${height / boxH})">${entry.fragment ?? entry.markup}</g>`;
    const baked = bakedFor(id);
    if (baked) {
      return `<g class="art art--baked ${className}" ${at}>${drawing}${imageTags(baked, 'art__image art__image--baked', width, height)}</g>`;
    }
    return `<g class="art ${className}" ${at}>${drawing}</g>`;
  }
  return `<g class="art ${className}" ${at}>${imageTags(entry.sources, 'art__image', width, height)}</g>`;
}

const imageCache = new Map<string, Promise<HTMLImageElement | undefined>>();

/**
 * A figure for a Canvas context: the cut-out image for the current Alice (an image
 * entry, or a baked picture in the pictures style), or nothing, in which case the
 * canvas draws its own vector stand-in. Resolved once.
 */
export function loadArtImage(id: string): Promise<HTMLImageElement | undefined> {
  const entry = ART[id];
  const sources = entry?.kind === 'image' ? entry.sources : bakedFor(id);
  if (!sources) {
    return Promise.resolve(undefined);
  }
  const source = sources[aliceVariant()] ?? sources.any;
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
