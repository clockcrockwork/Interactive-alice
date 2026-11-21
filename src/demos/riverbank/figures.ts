/**
 * The Riverbank's selected paintings and layered watch. Characters elsewhere
 * come from the art registry.
 */

/** The selected sister-and-book illustration, composited as one painted pose. */
export const SISTER_READING_SRC = new URL(
  '../../assets/images/figures/alices-sister-reading.any.generated.webp',
  import.meta.url,
).href;

/** A raster pocket-watch body with live hands and marks on a separate layer. */
export const WATCH_BODY_SRC = new URL(
  '../../assets/images/figures/watch-body.any.generated.webp',
  import.meta.url,
).href;

/** The watch out of his waistcoat pocket, seen close: a gold case, a paper
 * face, an ink hour hand and the minute hand in Wonderland red. */
export const WATCH_HTML = `
<span class="rb__watch-art" aria-hidden="true">
  <img class="rb__watch-body" src="${WATCH_BODY_SRC}" width="1104" height="1213" alt="" decoding="async" />
  <svg viewBox="0 0 200 220" focusable="false">
  <path d="M100 6 C70 6 60 20 60 20" stroke="var(--ix-gold)" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="8 6"/>
  <rect x="90" y="14" width="20" height="18" rx="4" fill="var(--ix-gold)" stroke="var(--sepia-dark)" stroke-width="2"/>
  <g stroke="var(--ink-ghost)" stroke-width="3" stroke-linecap="round">
    <path d="M100 52 v10 M100 178 v10 M32 120 h10 M158 120 h10"/>
    <path d="M134 61 l-5 9 M66 61 l5 9 M134 179 l-5 -9 M66 179 l5 -9 M159 86 l-9 5 M41 86 l9 5 M159 154 l-9 -5 M41 154 l9 -5" stroke-width="2"/>
  </g>
  <g class="rb__hands">
    <path d="M100 120 L100 74" stroke="var(--ink-primary)" stroke-width="6" stroke-linecap="round"/>
    <path d="M100 120 L146 92" stroke="var(--wonder-red)" stroke-width="4" stroke-linecap="round"/>
  </g>
  <circle cx="100" cy="120" r="5" fill="var(--ink-primary)"/>
</svg></span>`;

/** A clipped sample from the flowers in the existing illustrated ground strip. */
const FLOWER_X = [14, 21, 40, 45, 78, 84] as const;
export const flowerArt = (index: number): string =>
  `<span class="rb__flower-art" aria-hidden="true" style="--flower-x:${FLOWER_X[index % FLOWER_X.length]}%"></span>`;
