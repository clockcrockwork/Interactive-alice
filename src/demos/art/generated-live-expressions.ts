/** Untouched generated plates paired with the scenes' live SVG expressions. */
import type { ArtStyle } from './treatments.ts';
import { COOK_SVG, HATTER_SVG, MOUSE_SVG, QUEEN_SVG } from './vectors.ts';

const urls = {
  hatterBase: new URL(
    '../../assets/images/generated-layers/hatter~base.any.generated.webp',
    import.meta.url,
  ).href,
  hatterHat: new URL(
    '../../assets/images/generated-layers/hatter~hat.any.generated.webp',
    import.meta.url,
  ).href,
  dormouse: new URL(
    '../../assets/images/generated-layers/dormouse~base.any.generated.webp',
    import.meta.url,
  ).href,
  queen: new URL(
    '../../assets/images/generated-layers/queen-of-hearts~base.any.generated.webp',
    import.meta.url,
  ).href,
  cookBase: new URL(
    '../../assets/images/generated-layers/cook~base.any.generated.webp',
    import.meta.url,
  ).href,
  cookArm: new URL(
    '../../assets/images/generated-layers/cook~arm.any.generated.webp',
    import.meta.url,
  ).href,
};

const inner = (svg: string): string => svg.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const fallback = (markup: string): string => `<g data-rig-fallback="">${markup}</g>`;
const generated = (markup: string): string =>
  `<g data-rig-generated="" visibility="hidden" display="none">${markup}</g>`;
const image = (src: string, x: number, y: number, width: number, height: number): string =>
  `<image class="art__image" data-variant="any" data-rig-image="" href="${src}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>`;
const mapped = (markup: string, matrix: string): string =>
  `<g data-rig-map="" style="--rig-map: matrix(${matrix})">${markup}</g>`;

/** Only known, project-owned SVG markup enters these extraction helpers. */
function takeGroup(
  markup: string,
  className: string,
): { rest: string; content: string; before: string; after: string } {
  const start = markup.indexOf(`<g class="${className}"`);
  if (start < 0) throw new Error(`missing live group ${className}`);
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
        before: markup.slice(0, start),
        after: markup.slice(tags.lastIndex),
        content: markup.slice(contentStart, tag.index),
      };
  }
  throw new Error(`unclosed live group ${className}`);
}

function takeElement(markup: string, className: string): { rest: string; content: string } {
  const content = markup.match(new RegExp(`<[^>]+class="${className}"[^>]*/>`))?.[0];
  if (!content) throw new Error(`missing live element ${className}`);
  return { rest: markup.replace(content, ''), content };
}

function hatter(): string {
  const body = takeGroup(inner(HATTER_SVG), 'tp__hatter-body');
  const eyes = takeGroup(body.content, 'tp__hatter-eyes');
  const hat = takeGroup(eyes.rest, 'hatter__hat');
  const s = 160 / 984;
  const top = 260 - 1586 * s;
  // Keep the old eye coordinates: CSS can still animate ry from 5 to 10 to 3.
  const eyeScale = (78 * s) / 32;
  const eyeX = 452 * s - 64 * eyeScale;
  const eyeY = top + 319 * s - 100 * eyeScale;
  const drawing = `${fallback(body.rest)}<g class="tp__hatter-body">${fallback(hat.rest)}${generated(image(urls.hatterBase, 0, top, 984 * s, 1599 * s))}<g class="tp__hatter-eyes">${mapped(eyes.content, `${eyeScale}, 0, 0, ${eyeScale}, ${eyeX}, ${eyeY}`)}</g><g class="hatter__hat">${fallback(hat.content)}${generated(image(urls.hatterHat, 46 * s, top + 5 * s, 984 * s * 0.87, 1599 * s * 0.87))}</g></g>`;
  return `<svg viewBox="0 0 160 260" focusable="false" data-generated-rig="hatter">${drawing}</svg>`;
}

function dormouse(): string {
  const body = takeGroup(inner(MOUSE_SVG), 'dm__body');
  const open = takeElement(body.content, 'dm__eye-open');
  const shut = takeElement(open.rest, 'dm__eye-shut');
  const s = 140 / 1415;
  const top = 110 - 1015 * s;
  const eyeX = 1193 * s;
  const eyeY = top + 640 * s;
  // A parent map places both states together; their opacity hooks stay unique.
  const eyeMap = `<g data-rig-map="" style="--rig-map: translate(${eyeX}px, ${eyeY}px) rotate(30deg) scale(0.85) translate(-118px, -54px)">${shut.content}${open.content}</g>`;
  const drawing = `<g class="dm__body">${fallback(shut.rest)}${generated(image(urls.dormouse, 0, top, 1415 * s, 1111 * s))}${eyeMap}</g>${body.rest}`;
  return `<svg viewBox="0 0 140 110" focusable="false" data-generated-rig="dormouse">${drawing}</svg>`;
}

function queen(): string {
  const mouth = takeElement(inner(QUEEN_SVG), 'tr__queen-mouth');
  const s = 240 / 1537;
  const x = (160 - 1023 * s) / 2;
  const top = 240 - 1532 * s;
  const mouthScale = 0.265;
  const mouthX = x + 498 * s - 80 * mouthScale;
  const mouthY = top + 257 * s - 86 * mouthScale;
  const drawing = `${fallback(mouth.rest)}${generated(image(urls.queen, x, top, 1023 * s, 1537 * s))}${mapped(mouth.content, `${mouthScale}, 0, 0, ${mouthScale}, ${mouthX}, ${mouthY}`)}`;
  return `<svg viewBox="0 0 160 240" focusable="false" data-generated-rig="queen-of-hearts">${drawing}</svg>`;
}

function cook(): string {
  const arm = takeGroup(inner(COOK_SVG), 'pp__cook-arm');
  const s = 260 / 1430;
  const top = 260 - 1414 * s;
  // The edit enlarged and moved the arm. This uniform map restores its master
  // shoulder and ladle locations without resampling or cropping either raster.
  const armImage = image(urls.cookArm, 420 * s, top - 29 * s, 1100 * s * 0.59, 1430 * s * 0.59);
  const drawing = `${fallback(arm.before)}${generated(image(urls.cookBase, 0, top, 1100 * s, 1430 * s))}<g class="pp__cook-arm" data-rig-part="" style="--rig-origin: ${616 * s}px ${top + 450 * s}px">${fallback(arm.content)}${generated(armImage)}</g>${fallback(arm.after)}`;
  return `<svg viewBox="0 0 200 260" focusable="false" data-generated-rig="cook">${drawing}</svg>`;
}

const renderers: Record<string, () => string> = {
  hatter,
  dormouse,
  'queen-of-hearts': queen,
  cook,
};

const scenes: Record<string, readonly string[]> = {
  hatter: ['tea-party', 'witnesses'],
  dormouse: ['tea-party', 'dormouse', 'witnesses'],
  'queen-of-hearts': ['trial', 'witnesses', 'croquet', 'mock-turtle', 'duchess'],
  cook: ['pig-and-pepper', 'witnesses'],
};

/** Share the same rig across verified scenes; build-time previews stay unchanged. */
export function generatedLiveExpressionSvg(
  id: string,
  style: ArtStyle,
  demo?: string,
): string | undefined {
  return style === 'engraved' && demo && scenes[id]?.includes(demo) ? renderers[id]?.() : undefined;
}
