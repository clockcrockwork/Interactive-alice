/** Whole-pose runner cards; the outer figure remains the scene's motion owner. */
import type { AliceVariant } from './art.ts';
import type { ArtStyle } from './treatments.ts';
import { runnerSvg } from './vectors.ts';

const sources = {
  rest: new URL(
    '../../assets/images/figures/runner--alice~rest.yellow.generated.webp',
    import.meta.url,
  ).href,
  carry: new URL(
    '../../assets/images/figures/runner--alice~carry.yellow.generated.webp',
    import.meta.url,
  ).href,
};

export function generatedAliceRunnerSvg(
  id: string,
  style: ArtStyle,
  demo: string | undefined,
  variant: AliceVariant,
): string | undefined {
  if (
    id !== 'runner/alice' ||
    style !== 'engraved' ||
    variant !== 'yellow' ||
    !demo ||
    !['caucus-race', 'pool-of-tears', 'mouse-tale'].includes(demo)
  )
    return undefined;
  const scale = 112 / 1329;
  const x = (100 - 1164 * scale) / 2;
  // THIMBLE_SVG's lower rim is at y=84 in its 80×90 canvas. Its unchanged
  // 24%-wide, 0.8-scale carry box is centred at the attachment point.
  const handU = x + 907 * scale;
  const rimOffset = (84 - 45) * (24 / 80) * 0.8;
  const handV = 603 * scale - rimOffset;
  const original = runnerSvg('alice')
    .replace(/^<svg[^>]*><g class="cr__figure">/, '')
    .replace(/<\/g><\/svg>$/, '');
  const image = (pose: 'rest' | 'carry'): string =>
    `<g data-runner-pose="${pose}"${pose === 'carry' ? ' display="none"' : ''}><image class="art__image" data-variant="yellow" data-rig-image="" href="${sources[pose]}" x="${x}" y="0" width="${1164 * scale}" height="${1351 * scale}" preserveAspectRatio="xMidYMid meet"/></g>`;
  return `<svg viewBox="0 0 100 116" focusable="false" data-generated-rig="runner/alice" data-runner-hand-u="${handU}" data-runner-hand-v="${handV}" data-runner-hand-rim-offset="${rimOffset}" data-runner-pocket-u="${x + 730 * scale}" data-runner-pocket-v="${730 * scale}"><g class="cr__figure"><g data-rig-fallback="">${original}</g><g data-rig-generated="" visibility="hidden" display="none">${image('rest')}${image('carry')}</g></g></svg>`;
}
