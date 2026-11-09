/** Two generated poses, while the original walking/rolling hooks remain live. */
import type { ArtStyle } from './treatments.ts';
import { HEDGEHOG_SVG } from './vectors.ts';

const poses = [
  {
    name: 'ball',
    width: 1426,
    height: 1103,
    bounds: [252, 167, 1194, 1037],
    visibleWidth: 112,
    src: new URL(
      '../../assets/images/generated-layers/hedgehog~ball.any.generated.webp',
      import.meta.url,
    ).href,
  },
  {
    name: 'walk',
    width: 1414,
    height: 1112,
    bounds: [86, 125, 1370, 986],
    visibleWidth: 124,
    src: new URL(
      '../../assets/images/generated-layers/hedgehog~walk.any.generated.webp',
      import.meta.url,
    ).href,
  },
] as const;

export function generatedHedgehogSvg(style: ArtStyle, demo?: string): string | undefined {
  if (style !== 'engraved' || demo !== 'croquet') return undefined;
  const parts = poses
    .map((pose) => {
      const [left, , right, bottom] = pose.bounds;
      const scale = pose.visibleWidth / (right - left);
      const x = 70 - ((left + right) / 2) * scale;
      const y = 108 - (bottom - 1) * scale;
      const hook = `cq__hedgehog-${pose.name}`;
      const fallback =
        HEDGEHOG_SVG.match(new RegExp(`<g class="${hook}">([\\s\\S]*?)</g>`))?.[1] ?? '';
      return `<g class="${hook}" data-rig-part="" style="--rig-origin: 70px 110px"><g data-rig-fallback="">${fallback}</g><g data-rig-generated="" visibility="hidden" display="none"><image class="art__image" data-variant="any" data-rig-image="" href="${pose.src}" x="${x}" y="${y}" width="${pose.width * scale}" height="${pose.height * scale}" preserveAspectRatio="xMidYMid meet"/></g></g>`;
    })
    .join('');
  return `<svg viewBox="0 0 140 110" focusable="false" data-generated-rig="hedgehog">${parts}</svg>`;
}
