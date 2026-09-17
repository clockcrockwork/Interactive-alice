/** Alice's foot, Bill, and the crowd by the hedge. Decorative SVG. */

export const FOOT_SVG = `
<svg viewBox="0 0 200 260" focusable="false">
  <path d="M70 260 L70 120 Q70 90 100 90 Q130 90 130 120 L130 260 Z" fill="var(--alice-apron)"/>
  <path d="M78 130 h44 M78 150 h44 M78 170 h44 M78 190 h44" stroke="var(--alice-dress)" stroke-width="6" opacity="0.6"/>
  <path d="M62 100 Q100 60 138 100 Q150 118 130 130 L70 130 Q50 118 62 100 Z" fill="#1a1a1a"/>
  <ellipse cx="100" cy="128" rx="44" ry="10" fill="#1a1a1a"/>
</svg>`;

export const BILL_SVG = `
<svg viewBox="0 0 120 100" focusable="false">
  <path d="M10 70 Q40 30 80 50 Q110 66 100 84 Q60 96 20 84 Z" fill="var(--bl-lizard)"/>
  <circle cx="92" cy="46" r="16" fill="var(--bl-lizard)"/>
  <circle cx="98" cy="42" r="4" fill="#fff"/><circle cx="99" cy="42" r="2" fill="#222"/>
  <path d="M10 70 Q-10 60 4 40" stroke="var(--bl-lizard)" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M30 84 l-6 12 M60 90 l0 10 M84 84 l6 12" stroke="var(--bl-lizard)" stroke-width="6" stroke-linecap="round"/>
</svg>`;

export const CROWD_SVG = `
<svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice" focusable="false">
  ${[40, 110, 300, 360]
    .map(
      (x, i) =>
        `<g transform="translate(${x} 100)"><ellipse cx="0" cy="0" rx="22" ry="14" fill="oklch(${62 + i * 6}% 0.06 60)"/><circle cx="18" cy="-12" r="10" fill="oklch(${62 + i * 6}% 0.06 60)"/><circle cx="22" cy="-14" r="1.8" fill="#222"/></g>`,
    )
    .join('')}
  <g transform="translate(200 100)"><rect x="-6" y="-46" width="12" height="40" rx="3" fill="oklch(60% 0.12 60)"/><rect x="-3" y="-54" width="6" height="10" fill="oklch(40% 0.05 60)"/></g>
</svg>`;
