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
 * The engraved look (docs/art-trials.md) is delivered through that contract today: a
 * vector entry with a baked picture (baked.ts) gets the picture beside its vector,
 * and art.css shows one by the page's `data-art`; a figure whose parts the demo
 * moves gets its cut-outs, one picture per part, where they were baked.
 */

import { BAKED, BAKED_PARTS } from './baked.ts';
import { generatedAlicePoseSvg } from './generated-alice-poses.ts';
import { generatedAliceRunnerSvg } from './generated-alice-runner.ts';
import { generatedAliceSittingSvg } from './generated-alice-sitting.ts';
import { generatedAnimalSvg } from './generated-animal-layers.ts';
import { generatedBatDivingSvg } from './generated-bat-diving.ts';
import {
  generatedBillFragment,
  generatedCaterpillarBillSvg,
} from './generated-caterpillar-bill.ts';
import { generatedCheshireCatSvg } from './generated-cheshire-cat.ts';
import { generatedFallingCardSvg } from './generated-falling-card.ts';
import { generatedFlamingoSvg } from './generated-flamingo.ts';
import { generatedFlyingPigSvg } from './generated-flying-pig.ts';
import { generatedFootmanSvg } from './generated-footmen.ts';
import { generatedGardenFigureSvg } from './generated-garden-figures.ts';
import { generatedGardenerSvg } from './generated-gardeners.ts';
import { generatedGryphonSvg } from './generated-gryphon.ts';
import { generatedHedgehogSvg } from './generated-hedgehog.ts';
import { generatedJurySvg } from './generated-jury.ts';
import { generatedLiveExpressionSvg } from './generated-live-expressions.ts';
import { generatedMockTurtleSvg } from './generated-mock-turtle.ts';
import { generatedPigSvg } from './generated-pig-layers.ts';
import { generatedRunningRabbitSvg } from './generated-running-rabbit.ts';
import { generatedSeatedDuchessSvg } from './generated-seated-duchess.ts';
import { generatedTrialMouseSvg } from './generated-trial-mouse.ts';
import { generatedWalkingDuchessSvg } from './generated-walking-duchess.ts';
import {
  ART,
  type ArtEntry,
  CUT_OUTS,
  type ImageSource,
  LIVE_PARTS,
  OWN_COLOURS,
} from './registry.ts';
import { type ArtStyle, artStyle } from './treatments.ts';

export type AliceVariant = 'blue' | 'yellow';
type Sources = Partial<Record<AliceVariant | 'any', ImageSource>>;

/** Outside a browser (the build renders the index) the drawing is flat unless asked. */
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

/** Only the page's own Alice is put on a page: a hidden <img> would still be fetched. */
const forThisPage = (sources: Sources): Sources => {
  if (inBrowser && !sources.any) {
    const variant = aliceVariant();
    return { [variant]: sources[variant] };
  }
  return sources;
};

/**
 * The baked picture a figure shows, if any: only in the engraved style, where a
 * picture was baked for it, the demo does not move the figure's own parts and does
 * not give it colours of its own.
 */
export function bakedFor(
  id: string,
  style: ArtStyle = pageStyle(),
  demo: string | undefined = pageDemo(),
): Sources | undefined {
  const sources = BAKED[id];
  if (
    !sources ||
    style !== 'engraved' ||
    (demo && (LIVE_PARTS[id]?.includes(demo) || OWN_COLOURS[id]?.includes(demo)))
  ) {
    return undefined;
  }
  return forThisPage(sources);
}

export interface CutOuts {
  base: Sources;
  parts: [string, Sources][];
}

/**
 * The cut-outs a figure shows, if any: in the engraved style, on a page whose demo
 * moves the figure's parts, where the parts were baked one picture each.
 */
export function cutOutsFor(
  id: string,
  style: ArtStyle = pageStyle(),
  demo: string | undefined = pageDemo(),
): CutOuts | undefined {
  const baked = BAKED_PARTS[id];
  if (!baked || style !== 'engraved' || !demo || !CUT_OUTS[id]?.demos.includes(demo)) {
    return undefined;
  }
  return {
    base: forThisPage(baked.base),
    parts: Object.entries(baked.parts).map(([part, sources]) => [part, forThisPage(sources)]),
  };
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
 * The cut-outs as the drawing's own SVG: the same root (so its viewBox, and any
 * transform a demo puts on a part about a point in it, still hold), the picture of
 * everything that does not move, and each part's picture in a group with its class.
 */
function cutOutSvg(entry: Extract<ArtEntry, { kind: 'vector' }>, cut: CutOuts): string {
  const [w, h] = entry.box;
  const root = entry.markup.match(/<svg[^>]*>/)?.[0] ?? `<svg viewBox="0 0 ${w} ${h}">`;
  const parts = cut.parts
    .map(([part, sources]) => `<g class="${part}">${imageTags(sources, 'art__image', w, h)}</g>`)
    .join('');
  return `${root}${imageTags(cut.base, 'art__image', w, h)}${parts}</svg>`;
}

/**
 * A figure for an HTML context: a box with the drawing inside. The box carries the
 * id, so a stylesheet can address `[data-art="alice/falling"]` whatever is inside.
 */
export function figure(
  id: string,
  className = '',
  style: ArtStyle = pageStyle(),
  demo: string | undefined = pageDemo(),
  variant: AliceVariant = inBrowser ? aliceVariant() : 'yellow',
): string {
  const entry = entryOf(id);
  if (entry.kind === 'vector') {
    const alicePose =
      generatedAlicePoseSvg(id, style, demo, variant) ??
      generatedFallingCardSvg(id, style, demo, variant) ??
      generatedAliceSittingSvg(id, style, demo, variant) ??
      generatedAliceRunnerSvg(id, style, demo, variant);
    if (alicePose) {
      return `<span class="art art--cut art--generated ${className}" data-art="${id}" data-generated="">${alicePose}</span>`;
    }
    const articulated =
      generatedTrialMouseSvg(id, style, demo) ??
      generatedCaterpillarBillSvg(id, style, demo) ??
      generatedGardenerSvg(id, style, demo) ??
      generatedJurySvg(id, style, demo) ??
      generatedSeatedDuchessSvg(id, style, demo) ??
      generatedWalkingDuchessSvg(id, style, demo) ??
      generatedFlyingPigSvg(id, style, demo) ??
      generatedGryphonSvg(id, style, demo) ??
      generatedRunningRabbitSvg(id, style, demo) ??
      generatedBatDivingSvg(id, style, demo);
    if (articulated) {
      return `<span class="art art--cut art--generated ${className}" data-art="${id}" data-generated="" data-generated-layers="${id}">${articulated}</span>`;
    }
    const cat = generatedCheshireCatSvg(id, style, demo);
    if (cat) {
      return `<span class="art art--cut art--generated ${className}" data-art="${id}" data-generated="" data-generated-layers="${id}">${cat}</span>`;
    }
    const garden = generatedGardenFigureSvg(id, style, demo);
    if (garden) {
      return `<span class="art art--cut art--generated ${className}" data-art="${id}" data-generated="" data-generated-layers="${id}">${garden}</span>`;
    }
    const flamingo = generatedFlamingoSvg(id, style, demo);
    if (flamingo) {
      return `<span class="art art--cut art--generated ${className}" data-art="${id}" data-generated="" data-generated-layers="${id}">${flamingo}</span>`;
    }
    const footman = generatedFootmanSvg(id, style, demo);
    if (footman) {
      return `<span class="art art--cut art--generated ${className}" data-art="${id}" data-generated="" data-generated-layers="${id}">${footman}</span>`;
    }
    const mockTurtle = id === 'mock-turtle' ? generatedMockTurtleSvg(style, demo) : undefined;
    if (mockTurtle) {
      return `<span class="art art--cut art--generated ${className}" data-art="${id}" data-generated="" data-generated-layers="${id}">${mockTurtle}</span>`;
    }
    const hedgehog = id === 'hedgehog' ? generatedHedgehogSvg(style, demo) : undefined;
    if (hedgehog) {
      return `<span class="art art--cut art--generated ${className}" data-art="${id}" data-generated="" data-generated-layers="${id}">${hedgehog}</span>`;
    }
    const expression = generatedLiveExpressionSvg(id, style, demo);
    if (expression) {
      return `<span class="art art--cut art--generated ${className}" data-art="${id}" data-generated="" data-generated-layers="${id}">${expression}</span>`;
    }
    const animal = generatedAnimalSvg(id, style, demo);
    if (animal) {
      return `<span class="art art--cut art--generated ${className}" data-art="${id}" data-generated="" data-generated-layers="${id}">${animal}</span>`;
    }
    const pig = id === 'pig/trotting' ? generatedPigSvg(style, demo) : undefined;
    if (pig) {
      return `<span class="art art--cut art--generated ${className}" data-art="${id}" data-generated="" data-generated-layers="pig/trotting">${pig}</span>`;
    }
    const generatedVariant = entry.generated?.[variant] ? variant : 'any';
    const generated = style === 'engraved' ? entry.generated?.[generatedVariant] : undefined;
    if (generated) {
      const [w, h] = entry.box;
      const scale = Math.min(w / generated.width, h / generated.height);
      const width = generated.width * scale;
      const height = generated.height * scale;
      const x = (w - width) / 2;
      const y = h - generated.footY * scale;
      const image = `<image class="art__image" data-variant="${generatedVariant}" href="${generated.src}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>`;
      // Runners animate this group; their arms and scarf are inserted into it in
      // the same logical coordinates, above the picture and moving with it.
      const drawing = id.startsWith('runner/') ? `<g class="cr__figure">${image}</g>` : image;
      // Keep the scene's original layout/growth box. Only the image moves within
      // it: its visible soles, rather than its transparent padding, meet h.
      return `<span class="art art--cut art--generated ${className}" data-art="${id}" data-generated=""><svg viewBox="0 0 ${w} ${h}" focusable="false">${drawing}</svg></span>`;
    }
    const cut = cutOutsFor(id, style, demo);
    if (cut) {
      return `<span class="art art--cut ${className}" data-art="${id}">${cutOutSvg(entry, cut)}</span>`;
    }
    // A baked picture rides beside the vector; art.css shows one by `data-art`.
    const baked = bakedFor(id, style, demo);
    if (baked) {
      return `<span class="art art--baked ${className}" data-art="${id}">${entry.markup}${imgTags(baked, 'art__image art__image--baked')}</span>`;
    }
    return `<span class="art ${className}" data-art="${id}">${entry.markup}</span>`;
  }
  return `<span class="art ${className}" data-art="${id}">${imgTags(entry.sources, 'art__image')}</span>`;
}

let generatedPaintId = 0;

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
  style: ArtStyle = pageStyle(),
  demo: string | undefined = pageDemo(),
  variant: AliceVariant = inBrowser ? aliceVariant() : 'yellow',
): string {
  const entry = entryOf(id);
  const at = `data-art="${id}" transform="translate(${x} ${y})"`;
  if (entry.kind === 'vector') {
    const alicePose =
      generatedAlicePoseSvg(id, style, demo, variant) ??
      generatedFallingCardSvg(id, style, demo, variant) ??
      generatedAliceSittingSvg(id, style, demo, variant) ??
      generatedAliceRunnerSvg(id, style, demo, variant);
    if (alicePose) {
      return `<g class="art art--cut art--generated ${className}" ${at} data-generated=""><g transform="scale(${width / entry.box[0]} ${height / entry.box[1]})">${alicePose}</g></g>`;
    }
    const batDiving =
      generatedBatDivingSvg(id, style, demo) ??
      generatedTrialMouseSvg(id, style, demo) ??
      generatedSeatedDuchessSvg(id, style, demo) ??
      generatedWalkingDuchessSvg(id, style, demo);
    if (batDiving) {
      return `<g class="art art--cut art--generated ${className}" ${at} data-generated=""><g transform="scale(${width / entry.box[0]} ${height / entry.box[1]})">${batDiving}</g></g>`;
    }
    const bill = id === 'bill' ? generatedBillFragment(style, demo) : undefined;
    if (bill) {
      return `<g class="art art--cut art--generated ${className}" ${at} data-generated=""><g transform="scale(${width / 120} ${height / 100})">${bill}</g></g>`;
    }
    const garden = generatedGardenFigureSvg(id, style, demo);
    if (garden) {
      return `<g class="art art--cut art--generated ${className}" ${at} data-generated=""><g transform="scale(${width / entry.box[0]} ${height / entry.box[1]})">${garden}</g></g>`;
    }
    const [boxW, boxH] = entry.box;
    const generatedVariant = entry.generated?.[variant] ? variant : 'any';
    const generated = style === 'engraved' ? entry.generated?.[generatedVariant] : undefined;
    if (generated) {
      const scale = Math.min(boxW / generated.width, boxH / generated.height);
      const imageW = generated.width * scale;
      const imageH = generated.height * scale;
      const imageX = (boxW - imageW) / 2;
      const imageY = boxH - generated.footY * scale;
      const paintId = `art-generated-paint-${++generatedPaintId}`;
      // A paint server keeps the group's fill-box exactly the placement box.
      // Transparent pixels below the aligned soles must not move a scene's
      // 50% 100% growth pivot. Bottom padding stays outside the paint box.
      const image = `<image class="art__image" data-variant="${generatedVariant}" href="${generated.src}" x="${imageX}" y="${imageY}" width="${imageW}" height="${imageH}" preserveAspectRatio="xMidYMid meet"/>`;
      const paint = `<defs><pattern id="${paintId}" width="${boxW}" height="${boxH}" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse" patternTransform="scale(${width / boxW} ${height / boxH})" overflow="hidden">${image}</pattern></defs>`;
      return `<g class="art art--cut art--generated ${className}" ${at} data-generated="">${paint}<rect width="${width}" height="${height}" fill="url(#${paintId})"/></g>`;
    }
    const drawing = `<g transform="scale(${width / boxW} ${height / boxH})">${entry.fragment ?? entry.markup}</g>`;
    const baked = bakedFor(id, style, demo);
    if (baked) {
      const sources = baked.any ? { any: baked.any } : { [variant]: baked[variant] };
      return `<g class="art art--baked ${className}" ${at}>${drawing}${imageTags(sources, 'art__image art__image--baked', width, height)}</g>`;
    }
    return `<g class="art ${className}" ${at}>${drawing}</g>`;
  }
  return `<g class="art ${className}" ${at}>${imageTags(entry.sources, 'art__image', width, height)}</g>`;
}

const imageCache = new Map<string, Promise<HTMLImageElement | undefined>>();

/**
 * A figure for a Canvas context: the cut-out image for the current Alice (an image
 * entry, or a baked picture in the engraved style), or nothing, in which case the
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
