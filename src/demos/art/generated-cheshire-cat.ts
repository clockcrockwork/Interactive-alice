/** Shared cat plates retain each scene's original independently moving targets. */
import type { ArtStyle } from './treatments.ts';
import { CAT_HEAD_SVG, CAT_HEARTH_SVG, CAT_SVG } from './vectors.ts';

const urls = {
  face: new URL(
    '../../assets/images/generated-layers/cheshire-cat~head-face.any.generated.webp',
    import.meta.url,
  ).href,
  ears: new URL(
    '../../assets/images/generated-layers/cheshire-cat~head-ears.any.generated.webp',
    import.meta.url,
  ).href,
  left: new URL(
    '../../assets/images/generated-layers/cheshire-cat~head-eye-left.any.generated.webp',
    import.meta.url,
  ).href,
  right: new URL(
    '../../assets/images/generated-layers/cheshire-cat~head-eye-right.any.generated.webp',
    import.meta.url,
  ).href,
  grin: new URL(
    '../../assets/images/generated-layers/cheshire-cat~head-grin.any.generated.webp',
    import.meta.url,
  ).href,
  bough: new URL(
    '../../assets/images/generated-layers/cheshire-cat~bough-body.any.generated.webp',
    import.meta.url,
  ).href,
  tail: new URL(
    '../../assets/images/generated-layers/cheshire-cat~bough-tail.any.generated.webp',
    import.meta.url,
  ).href,
  hearth: new URL(
    '../../assets/images/generated-layers/cheshire-cat~hearth-body.any.generated.webp',
    import.meta.url,
  ).href,
};

type Map = { x: number; y: number; scale: number };
const fallback = (markup: string): string => `<g data-rig-fallback="">${markup}</g>`;
const generated = (markup: string): string =>
  `<g data-rig-generated="" visibility="hidden" display="none">${markup}</g>`;
const image = (src: string, w: number, h: number, map: Map): string =>
  `<image class="art__image" data-variant="any" data-rig-image="" href="${src}" x="${map.x}" y="${map.y}" width="${w * map.scale}" height="${h * map.scale}" preserveAspectRatio="xMidYMid meet"/>`;
const origin = (map: Map, x: number, y: number): string =>
  ` data-rig-part="" style="--rig-origin: ${map.x + x * map.scale}px ${map.y + y * map.scale}px"`;
const compose = (a: Map, b: Map): Map => ({
  x: a.x + b.x * a.scale,
  y: a.y + b.y * a.scale,
  scale: a.scale * b.scale,
});

/** Only the project's fixed vector markup enters this balanced group extractor. */
function group(
  markup: string,
  attribute: string,
): { before: string; open: string; content: string; after: string } {
  const start = markup.indexOf(attribute);
  const from = markup.lastIndexOf('<g', start);
  if (start < 0 || from < 0) throw new Error(`missing cat group ${attribute}`);
  const tags = /<\/?g\b[^>]*>/g;
  tags.lastIndex = from;
  let depth = 0;
  let contentStart = from;
  for (let tag = tags.exec(markup); tag; tag = tags.exec(markup)) {
    if (tag[0].startsWith('</')) depth--;
    else {
      depth++;
      if (depth === 1) contentStart = tags.lastIndex;
    }
    if (depth === 0)
      return {
        before: markup.slice(0, from),
        open: markup.slice(from, contentStart),
        content: markup.slice(contentStart, tag.index),
        after: markup.slice(tags.lastIndex),
      };
  }
  throw new Error(`unclosed cat group ${attribute}`);
}

let apertureId = 0;

function head(svg: string, map: Map): string {
  let drawing = svg;
  const clipId = `cat-pupil-apertures-${++apertureId}`;
  for (const part of ['ears', 'face', 'eyes', 'pupils', 'grin'] as const) {
    const old = group(drawing, `data-cat="${part}"`);
    let plate: string;
    if (part === 'eyes') {
      const left = compose(map, { x: 236.5, y: 240.25, scale: 0.55 });
      const right = compose(map, { x: 481.2, y: 261.6, scale: 0.52 });
      plate =
        generated(image(urls.left, 1374, 1145, left)) +
        `<g data-cat-eye="right"${origin(map, 905, 584)}>${generated(image(urls.right, 1374, 1145, right))}</g>`;
    } else if (part === 'pupils') {
      // Fixed apertures contain the moving pupils, not the scene's whole head.
      // These SVG paths affect vector pupils only; raster layers stay untouched.
      const apertures = `<defs><clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><path transform="translate(${map.x} ${map.y}) scale(${map.scale})" d="M420 528 C478 516 551 573 570 632 C491 656 426 610 420 528Z M980 530 C919 513 847 572 826 634 C904 656 973 611 980 530Z"/></clipPath></defs>`;
      plate = generated(
        `${apertures}<g clip-path="url(#${clipId})"><g data-cat-live-pupils="">${[495, 905].map((x) => `<ellipse cx="${map.x + x * map.scale}" cy="${map.y + 584 * map.scale}" rx="${14 * map.scale}" ry="${38 * map.scale}" fill="var(--ink-primary)"/>`).join('')}</g></g>`,
      );
    } else plate = generated(image(urls[part], 1374, 1145, map));
    const open = part === 'grin' ? old.open.replace(/>$/, `${origin(map, 690, 840)}>`) : old.open;
    drawing = `${old.before}${open}${fallback(old.content)}${plate}</g>${old.after}`;
  }
  return drawing;
}

function faceMap(cx: number, cy: number, radius: number): Map {
  const r = radius / 76;
  return { x: cx + (23.4 - 120) * r, y: cy + (18.4 - 110) * r, scale: 0.14 * r };
}

function hearth(): string {
  const drawing = head(CAT_HEARTH_SVG, faceMap(170, 76, 46));
  const first = group(drawing, 'data-cat="ears"');
  const rootEnd = first.before.indexOf('>') + 1;
  return (
    first.before.slice(0, rootEnd) +
    fallback(first.before.slice(rootEnd)) +
    generated(image(urls.hearth, 1536, 1024, { x: 4.8, y: 22, scale: 0.15 })) +
    first.open +
    first.content +
    '</g>' +
    first.after
  );
}

function bough(): string {
  const drawing = head(CAT_SVG, faceMap(300, 96, 52));
  const cat = group(drawing, 'class="cc__cat"');
  const tail = group(cat.content, 'class="cc__tail"');
  const ears = group(tail.after, 'data-cat="ears"');
  const body = generated(image(urls.bough, 1619, 971, { x: 96.1, y: 74.3, scale: 0.1548 }));
  const tailMap = { x: 70.72, y: 52.52, scale: 0.1404 };
  const joint = `<g class="cc__tail"${origin({ x: 70, y: 50, scale: 0.18 }, 315, 585)}>${fallback(tail.content)}${generated(image(urls.tail, 1620, 971, tailMap))}</g>`;
  return `${cat.before}${cat.open}${tail.before}${joint}${fallback(ears.before)}${body}${ears.open}${ears.content}</g>${ears.after}</g>${cat.after}`;
}

const renderers: Record<string, { demo: string; draw: () => string }> = {
  'cheshire-cat/head': { demo: 'croquet', draw: () => head(CAT_HEAD_SVG, faceMap(120, 110, 76)) },
  'cheshire-cat/on-hearth': { demo: 'pig-and-pepper', draw: hearth },
  'cheshire-cat/on-bough': { demo: 'cheshire-cat', draw: bough },
};

/** Unsupported scenes and non-engraved treatments retain their vector authority. */
export function generatedCheshireCatSvg(
  id: string,
  style: ArtStyle,
  demo?: string,
): string | undefined {
  const renderer = renderers[id];
  if (style !== 'engraved' || !demo || renderer?.demo !== demo) return undefined;
  return renderer.draw().replace('<svg ', `<svg data-generated-rig="${id}" `);
}
