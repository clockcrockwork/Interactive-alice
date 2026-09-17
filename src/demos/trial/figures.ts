/** Paper-theatre cutouts for the trial. Decorative SVG, drawn once. */

export const TARTS_SVG = `
<svg viewBox="0 0 260 140" focusable="false">
  <rect x="10" y="80" width="240" height="14" rx="4" fill="oklch(52% 0.08 60)"/>
  <rect x="30" y="94" width="14" height="46" fill="oklch(46% 0.08 60)"/>
  <rect x="216" y="94" width="14" height="46" fill="oklch(46% 0.08 60)"/>
  <ellipse cx="130" cy="78" rx="96" ry="14" fill="oklch(96% 0.01 80)"/>
  ${[60, 100, 140, 180, 200, 80, 120, 160]
    .map(
      (x, i) =>
        `<g transform="translate(${x} ${i < 5 ? 66 : 54})"><ellipse cx="0" cy="0" rx="18" ry="9" fill="oklch(78% 0.1 70)"/><ellipse cx="0" cy="-3" rx="11" ry="6" fill="oklch(58% 0.22 25)"/></g>`,
    )
    .join('')}
</svg>`;
