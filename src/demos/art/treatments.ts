/**
 * How the registry's figures are drawn (docs/art-trials.md). Engraved is the chosen
 * look and the default: an old book's engraved plate, delivered as pictures baked
 * through the engraved filter ahead of time (scripts/bake-art.mjs), with the same
 * filter applied at runtime only to the figures that could not be baked. Flat (the
 * vectors as drawn) and cut paper stay selectable on the index for now. The
 * visitor's choice is `data-art` on the root, applied before first paint by the
 * head script beside `data-alice`; engraved sets nothing.
 *
 * Engraved, the paper rim of dark grounds, and cut paper are SVG filters defined
 * once per page and applied by art.css to the drawing inside each figure box.
 * Every colour a filter paints is a token, set from art.css on the flood primitives.
 */

export const ART_STYLES = ['engraved', 'flat', 'paper'] as const;
export type ArtStyle = (typeof ART_STYLES)[number];

/** Where the choice is remembered; the demos' own localStorage namespace. */
export const ART_KEY = 'alice-demos:art';

/**
 * A stored or attribute value as a style. Anything else is engraved: no value, an
 * unknown one, and `baked`, the trial's name for the engraved pictures.
 */
export const parseArtStyle = (value: string | null | undefined): ArtStyle =>
  ART_STYLES.find((style) => style === value) ?? 'engraved';

/** The style the page is showing: the head script set it before first paint. */
export const artStyle = (): ArtStyle => parseArtStyle(document.documentElement.dataset.art);

/** One tile of hatching, ink-agnostic: only its alpha is used, the ink is a token. */
const tile = (size: number, path: string): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><path d="${path}" stroke="black" stroke-width="0.9" fill="none"/></svg>`,
  )}`;

/** Diagonal hatching one way, the other way, and a close horizontal rule. */
const HATCH = 6;
const HATCH_RISING = tile(HATCH, 'M-1 1 L1 -1 M0 6 L6 0 M5 7 L7 5');
const HATCH_FALLING = tile(HATCH, 'M-1 5 L1 7 M0 0 L6 6 M5 -1 L7 1');
const HATCH_RULE = tile(3, 'M0 1.5 H3');

interface Engraving {
  id: string;
  /** How much of the figure's own colour survives under the ink, 0..1. */
  tint: number;
  /** Darkness (1 - luminance) at which each hatching layer starts. */
  hatch: [number, number, number];
}

/** A darkness threshold as a soft ramp on alpha: 0 below `from`, 1 a step above. */
const ramp = (from: number): string =>
  `<feFuncA type="linear" slope="7" intercept="${(-7 * from).toFixed(2)}"/>`;

/**
 * An old book's engraved plate: the fills washed toward the paper, the shadows
 * hatched and cross-hatched in ink by how dark they were, and every edge between
 * two tints (and the outline against the page) drawn as an ink line.
 */
function engravedFilter({ id, tint, hatch }: Engraving): string {
  const layer = (name: string, href: string, size: number, from: number): string =>
    `<feComponentTransfer in="dark" result="${name}-mask">${ramp(from)}</feComponentTransfer>` +
    `<feImage href="${href}" x="0" y="0" width="${size}" height="${size}" result="${name}-tile"/>` +
    `<feTile in="${name}-tile" result="${name}-lines"/>` +
    `<feComposite in="${name}-lines" in2="${name}-mask" operator="in" result="${name}"/>`;
  return `<filter id="${id}" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">
  <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.2126 -0.7152 -0.0722 0 1" result="dark-raw"/>
  <feComposite in="dark-raw" in2="SourceAlpha" operator="in" result="dark"/>
  ${layer('rising', HATCH_RISING, HATCH, hatch[0])}
  ${layer('falling', HATCH_FALLING, HATCH, hatch[1])}
  ${layer('rule', HATCH_RULE, 3, hatch[2])}
  <feColorMatrix in="SourceGraphic" type="matrix" values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0" result="lum"/>
  <feConvolveMatrix in="lum" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" result="edge-raw"/>
  <feColorMatrix in="edge-raw" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 5 0 0 0 -0.35" result="edge-line"/>
  <feComposite in="edge-line" in2="SourceAlpha" operator="in" result="edge"/>
  <feMorphology in="SourceAlpha" operator="erode" radius="1" result="inner"/>
  <feComposite in="SourceAlpha" in2="inner" operator="out" result="contour"/>
  <feMerge result="ink-alpha"><feMergeNode in="rising"/><feMergeNode in="falling"/><feMergeNode in="rule"/><feMergeNode in="edge"/><feMergeNode in="contour"/></feMerge>
  <feFlood class="art-fx-ink" result="ink-colour"/>
  <feComposite in="ink-colour" in2="ink-alpha" operator="in" result="ink"/>
  <feFlood class="art-fx-paper" result="paper-colour"/>
  <feComposite in="paper-colour" in2="SourceAlpha" operator="in" result="paper"/>
  <feComposite in="SourceGraphic" in2="paper" operator="arithmetic" k2="${tint}" k3="${(1 - tint).toFixed(2)}" result="wash"/>
  <feMerge><feMergeNode in="wash"/><feMergeNode in="ink"/></feMerge>
</filter>`;
}

/**
 * Shapes cut from tinted paper: the edge torn a little by a low noise, a fine grain
 * in the fill, the paper's pale core showing at the cut, and a soft shadow lifting
 * the piece off the page.
 */
const PAPER_FILTER = `<filter id="art-paper" x="-6%" y="-6%" width="116%" height="116%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="7" result="warp"/>
  <feDisplacementMap in="SourceGraphic" in2="warp" scale="4" xChannelSelector="R" yChannelSelector="G" result="cut"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="noise"/>
  <feColorMatrix in="noise" type="matrix" values="0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 0 1" result="grain"/>
  <feComposite in="cut" in2="grain" operator="arithmetic" k1="0.45" k2="0.75" result="grained-raw"/>
  <feComposite in="grained-raw" in2="cut" operator="in" result="grained"/>
  <feMorphology in="cut" operator="dilate" radius="1.4" result="rim-shape"/>
  <feFlood class="art-fx-paper" result="rim-colour"/>
  <feComposite in="rim-colour" in2="rim-shape" operator="in" result="rim"/>
  <feGaussianBlur in="rim-shape" stdDeviation="2.2" result="shadow-blur"/>
  <feOffset in="shadow-blur" dx="2" dy="3" result="shadow-shape"/>
  <feFlood class="art-fx-shadow" result="shadow-colour"/>
  <feComposite in="shadow-colour" in2="shadow-shape" operator="in" result="shadow"/>
  <feMerge><feMergeNode in="shadow"/><feMergeNode in="rim"/><feMergeNode in="grained"/></feMerge>
</filter>`;

/**
 * A paper rim round the whole figure, for a dark ground (`data-ground="dark"` on the
 * page): the shape grown by a pixel and a half and filled with the paper, under the
 * figure, so a hatched figure keeps its edge against the night wood or the court's
 * red. Applied after the engraving, or alone on a baked picture.
 */
const RIM_FILTER = `<filter id="art-rim" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">
  <feMorphology in="SourceAlpha" operator="dilate" radius="1.5" result="rim-shape"/>
  <feFlood class="art-fx-rim" result="rim-colour"/>
  <feComposite in="rim-colour" in2="rim-shape" operator="in" result="rim"/>
  <feMerge><feMergeNode in="rim"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>`;

/** Engraving settings: Alice keeps more of her own colours than Wonderland does. */
export const ENGRAVINGS: readonly Engraving[] = [
  { id: 'art-engraved', tint: 0.6, hatch: [0.4, 0.6, 0.8] },
  { id: 'art-engraved-alice', tint: 0.85, hatch: [0.5, 0.68, 0.84] },
];

/** The filter definitions as one hidden SVG, for a page or for the bake script. */
export const artFilterDefs = (): string =>
  `<svg class="art-defs" aria-hidden="true" focusable="false" width="0" height="0"><defs>${ENGRAVINGS.map(engravedFilter).join('')}${RIM_FILTER}${PAPER_FILTER}</defs></svg>`;

/**
 * Puts the filters on the page once, unless the page is flat, or always, where the
 * visitor can switch styles live. A flat page is left exactly as it was.
 */
export function installArtTreatments(always = false): void {
  if (!always && artStyle() === 'flat') {
    return;
  }
  if (document.querySelector('.art-defs')) {
    return;
  }
  document.body.insertAdjacentHTML('beforeend', artFilterDefs());
}
