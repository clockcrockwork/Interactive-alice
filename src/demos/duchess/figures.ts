/**
 * The walk's own props, drawn once as SVG: the mustard-mine far off along the
 * ground (a little pithead with its wheel, a heap and a loaded cart), and the
 * pair of wings the pig-baby flies on when pigs have to fly. No words anywhere.
 */

/** The mustard-mine: a timber pithead over the shaft, its winding wheel, a cart
    of mustard on a few yards of rail, and the heap it came from. Feet on the
    bottom edge, as a figure's are. */
export const MINE_SVG = `
<svg class="dc__mine-art" viewBox="0 0 240 150" focusable="false">
  <ellipse cx="124" cy="146" rx="116" ry="6" fill="var(--dc-shadow)"/>
  <path d="M132 146 Q150 52 184 40 Q214 46 236 146 Z" fill="var(--dc-mustard-deep)"/>
  <path d="M140 146 Q156 64 184 52 Q206 58 226 146 Z" fill="var(--dc-mustard)"/>
  <path d="M168 76 l4 -3 M190 70 l4 2 M176 100 l5 -2 M204 96 l3 3 M160 120 l5 -1 M196 124 l4 2" stroke="var(--dc-mustard-deep)" stroke-width="3" stroke-linecap="round"/>
  <rect x="46" y="128" width="40" height="18" fill="var(--ink-primary)"/>
  <path d="M30 146 L60 18 M102 146 L72 18" stroke="var(--sepia-dark)" stroke-width="7" stroke-linecap="round"/>
  <path d="M38 112 H94 M46 78 H86 M53 48 H79 M38 112 L86 78 M94 112 L46 78" stroke="var(--sepia-deep)" stroke-width="4" stroke-linecap="round"/>
  <path d="M66 22 V130" stroke="var(--ink-secondary)" stroke-width="2"/>
  <g class="dc__mine-wheel">
    <circle cx="66" cy="20" r="15" fill="none" stroke="var(--sepia-deep)" stroke-width="4"/>
    <path d="M66 5 V35 M51 20 H81 M55 9 L77 31 M77 9 L55 31" stroke="var(--sepia-deep)" stroke-width="2.4"/>
    <circle cx="66" cy="20" r="3.5" fill="var(--ink-primary)"/>
  </g>
  <path d="M84 144 H176" stroke="var(--ink-faded)" stroke-width="3" stroke-linecap="round"/>
  <path d="M96 116 h56 l-7 22 h-42 z" fill="var(--sepia-mid)"/>
  <path d="M96 116 h56" stroke="var(--sepia-deep)" stroke-width="3" stroke-linecap="round"/>
  <path d="M98 117 Q124 92 150 117 Z" fill="var(--dc-mustard)"/>
  <circle cx="110" cy="140" r="5.5" fill="var(--ink-primary)"/>
  <circle cx="138" cy="140" r="5.5" fill="var(--ink-primary)"/>
</svg>`;

/** One wing: printed paper with an ink edge and three feathered scallops. The
    pig carries a pair, the right one mirrored in CSS. */
export const WING_SVG = `
<svg class="dc__wing-art" viewBox="0 0 100 60" focusable="false">
  <path d="M96 52 C80 20 46 4 6 8 C16 16 18 22 12 30 C24 30 28 36 22 44 C36 42 42 48 38 56 C58 50 78 50 96 52 Z" fill="var(--paper-aged)" stroke="var(--ink-secondary)" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M90 48 C70 30 46 22 22 22 M86 50 C68 40 52 36 34 38" stroke="var(--ink-faded)" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>`;

/** The flamingo's snap: three short ink strokes off the end of its beak. */
export const SNAP_SVG = `
<svg viewBox="0 0 40 40" focusable="false">
  <path d="M30 10 L18 16 M32 22 H16 M30 34 L18 28" stroke="var(--ink-primary)" stroke-width="3.4" stroke-linecap="round"/>
</svg>`;
