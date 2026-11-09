/** One articulated bird, with the original colour-token hands still live. */
import type { ArtStyle } from './treatments.ts';
import { FLAMINGO_SVG } from './vectors.ts';

const body = new URL(
  '../../assets/images/generated-layers/flamingo~body.any.generated.webp',
  import.meta.url,
).href;
const head = new URL(
  '../../assets/images/generated-layers/flamingo~head.any.generated.webp',
  import.meta.url,
).href;
const scale = 300 / 1060;
let sequence = 0;
const fallback = (markup: string): string => `<g data-rig-fallback="">${markup}</g>`;
const generated = (markup: string): string =>
  `<g data-rig-generated="" visibility="hidden" display="none">${markup}</g>`;
const image = (src: string): string =>
  `<image class="art__image" data-variant="any" data-rig-image="" href="${src}" x="0" y="0" width="300" height="420" preserveAspectRatio="xMidYMid meet"/>`;

/** The tucked pose stays vector until it has independently movable bite parts. */
export function generatedFlamingoSvg(
  id: string,
  style: ArtStyle,
  demo?: string,
): string | undefined {
  if (id !== 'flamingo' || style !== 'engraved' || demo !== 'croquet') return undefined;
  const original = FLAMINGO_SVG.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const originalBody = original.match(/<g class="cq__flamingo-body">([\s\S]*?)<\/g>/);
  const originalHead = original.match(/<g class="cq__flamingo-head">([\s\S]*?)<\/g>/);
  if (!originalBody || !originalHead) return undefined;
  const hands = original.replace(originalBody[0], '').replace(originalHead[0], '');
  const key = ++sequence;
  const headId = `art-flamingo-head-${key}`;
  const bodyId = `art-flamingo-body-${key}`;
  // Keep the articulated hooks on visible instances: transforms on referenced
  // definition nodes are not reliably painted by the browser's <use> shadow tree.
  const headDefinition = `<g id="${headId}" data-rig-part="" style="--rig-origin: ${650 * scale}px ${310 * scale}px">${fallback(originalHead[1] ?? '')}${generated(image(head))}</g>`;
  const bodyDefinition = `<g id="${bodyId}" data-rig-part="" style="--rig-origin: 170px 300px">${fallback(originalBody[1] ?? '')}${generated(image(body))}</g>`;
  // Animate the rendered use instances, not their definitions. CSS transforms on
  // a node inside <defs> are not consistently painted by Chromium's <use> shadow
  // tree, especially with reduced motion's immediate transform changes.
  const mounted = `<g class="cq__flamingo-body" data-rig-part="" style="--rig-origin: 170px 300px"><use href="#${bodyId}"/>${generated(`<g data-flamingo-head-mounted=""><use class="cq__flamingo-head" data-rig-part="" href="#${headId}" style="--rig-origin: ${650 * scale}px ${310 * scale}px"/></g>`)}</g>`;
  const originalHeadUse = `<g data-flamingo-head-original=""><use class="cq__flamingo-head-fallback" href="#${headId}"/></g>`;
  return `<svg viewBox="0 0 300 420" focusable="false" data-generated-rig="flamingo"><defs>${headDefinition}${bodyDefinition}</defs><g data-flamingo-hands="">${hands}</g>${mounted}${fallback(originalHeadUse)}</svg>`;
}
