/** Whole mouse reused only for Trial's dream; the Pool renderer stays independent. */
import type { ArtStyle } from './treatments.ts';

const image = new URL(
  '../../assets/images/figures/runner--mouse.any.generated.webp',
  import.meta.url,
).href;
// Fit the visible alpha > 32 bounds (36, 434)-(1154, 1118), not the padded
// source canvas. Keep its aspect ratio and two logical units above/below.
const scale = 56 / (1118 - 434);
const imageX = 60 - ((36 + 1154) / 2) * scale;
const imageY = 2 - 434 * scale;
let serial = 0;

export function generatedTrialMouseSvg(
  id: string,
  style: ArtStyle,
  demo?: string,
): string | undefined {
  if (id !== 'mouse/swimming' || style !== 'engraved' || demo !== 'trial') return undefined;
  const paint = `trial-mouse-paint-${++serial}`;
  // A fixed paint box preserves the dream wrapper's size during its drift and
  // reeds crossfade. This identity's original registry markup is truly empty:
  // do not invent a fallback or change the Pool's independent swimming drawing.
  return `<svg width="120" height="60" viewBox="0 0 120 60" focusable="false" data-generated-rig="mouse/trial-dream"><g data-rig-fallback=""></g><g data-rig-generated="" visibility="hidden" display="none"><defs><pattern id="${paint}" width="120" height="60" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse" overflow="hidden"><image class="art__image" data-variant="any" data-rig-image="" href="${image}" x="${imageX}" y="${imageY}" width="${1164 * scale}" height="${1351 * scale}" preserveAspectRatio="xMidYMid meet"/></pattern></defs><rect width="120" height="60" fill="url(#${paint})"/></g></svg>`;
}
