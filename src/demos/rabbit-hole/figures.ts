/**
 * The DOM-drawn figures of the rabbit hole: Alice, the marmalade jar, a bat, Dinah
 * and the White Rabbit. Plain SVG markup, decorative, drawn once.
 */

/**
 * A map off the well's wall, drawn large enough to be looked at: a sea with waves,
 * two coasts, hills, a river, a dotted route and a compass rose. Pictures only; a
 * map in a book of pictures carries no lettering.
 */
export const MAP_SVG = `
<svg viewBox="0 0 400 300" focusable="false">
  <rect x="2" y="2" width="396" height="296" rx="4" fill="var(--rh-paper)" stroke="var(--rh-paper-frame)" stroke-width="4"/>
  <rect x="12" y="12" width="376" height="276" fill="none" stroke="var(--rh-paper-frame)" stroke-width="1.5" opacity="0.7"/>
  <g stroke="var(--rh-paper-ink)" stroke-width="0.6" opacity="0.25">
    <path d="M12 60 H388 M12 120 H388 M12 180 H388 M12 240 H388 M80 12 V288 M160 12 V288 M240 12 V288 M320 12 V288"/>
  </g>
  <path d="M12 12 H180 C150 40 170 70 140 96 C110 120 120 160 90 190 C60 220 70 260 50 288 H12 Z" fill="var(--rh-map-sea)"/>
  <path d="M388 200 C350 210 330 250 340 288 H388 Z" fill="var(--rh-map-sea)"/>
  <g stroke="var(--rh-paper-ink)" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M180 12 C150 40 170 70 140 96 C110 120 120 160 90 190 C60 220 70 260 50 288"/>
    <path d="M388 200 C350 210 330 250 340 288"/>
  </g>
  <g stroke="var(--rh-paper-ink)" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.7">
    <path d="M40 60 q6 -5 12 0 t12 0 M60 110 q6 -5 12 0 t12 0 M30 150 q6 -5 12 0 t12 0 M70 230 q6 -5 12 0 t12 0 M28 260 q6 -5 12 0 t12 0 M110 40 q6 -5 12 0 t12 0 M360 250 q6 -5 12 0 t12 0"/>
  </g>
  <g stroke="var(--rh-paper-ink)" stroke-width="1.5" fill="var(--rh-paper)" stroke-linejoin="round">
    <path d="M200 80 q14 -22 28 0 M214 86 q14 -24 28 0 M232 76 q12 -18 24 0 M250 90 q14 -22 28 0 M268 76 q12 -18 24 0"/>
    <path d="M150 220 q14 -22 28 0 M166 230 q14 -24 28 0 M190 214 q12 -18 24 0"/>
  </g>
  <g stroke="var(--rh-paper-ink)" stroke-width="0.9" opacity="0.55">
    <path d="M206 78 l3 -6 M212 72 l3 -6 M224 84 l3 -6 M230 78 l3 -6 M258 88 l3 -6 M264 82 l3 -6 M158 218 l3 -6 M164 212 l3 -6 M198 212 l3 -6"/>
  </g>
  <path d="M270 100 C250 130 230 140 232 170 C234 200 200 220 160 250 C140 265 120 272 100 280" stroke="var(--rh-map-sea)" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M270 100 C250 130 230 140 232 170 C234 200 200 220 160 250 C140 265 120 272 100 280" stroke="var(--rh-paper-ink)" stroke-width="1" fill="none" opacity="0.6"/>
  <g fill="var(--rh-paper-ink)" opacity="0.8">
    <circle cx="300" cy="150" r="4"/><rect x="299" y="150" width="2" height="8"/>
    <circle cx="316" cy="162" r="4"/><rect x="315" y="162" width="2" height="8"/>
    <circle cx="306" cy="176" r="4"/><rect x="305" y="176" width="2" height="8"/>
    <circle cx="120" cy="190" r="3.5"/><rect x="119" y="190" width="2" height="7"/>
    <circle cx="134" cy="202" r="3.5"/><rect x="133" y="202" width="2" height="7"/>
  </g>
  <g fill="none" stroke="var(--rh-paper-ink)" stroke-width="2" stroke-linecap="round">
    <path d="M70 80 C120 90 150 120 170 150 C190 180 230 190 250 230" stroke-dasharray="1 7"/>
    <path d="M250 230 C270 250 300 240 330 258" stroke-dasharray="1 7"/>
  </g>
  <g stroke="var(--rh-paper-ink)" stroke-width="1.8">
    <path d="M62 76 l6 8 M62 84 l6 -8"/>
    <path d="M326 254 l8 8 M326 262 l8 -8" stroke="var(--wonder-red-faded)" stroke-width="2.2"/>
  </g>
  <circle cx="62" cy="80" r="3" fill="var(--rh-paper)" stroke="var(--rh-paper-ink)" stroke-width="1.5"/>
  <g transform="translate(330 70)">
    <circle r="30" fill="none" stroke="var(--rh-paper-ink)" stroke-width="1.2" opacity="0.7"/>
    <circle r="22" fill="none" stroke="var(--rh-paper-ink)" stroke-width="0.8" opacity="0.5"/>
    <path d="M0 -36 L5 -5 L36 0 L5 5 L0 36 L-5 5 L-36 0 L-5 -5 Z" fill="var(--rh-paper)" stroke="var(--rh-paper-ink)" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M0 -36 L5 -5 L0 0 Z M36 0 L5 5 L0 0 Z M0 36 L-5 5 L0 0 Z M-36 0 L-5 -5 L0 0 Z" fill="var(--rh-paper-ink)" opacity="0.8"/>
    <path d="M22 -22 L3 -3 M22 22 L3 3 M-22 22 L-3 3 M-22 -22 L-3 -3" stroke="var(--rh-paper-ink)" stroke-width="1.2" opacity="0.7"/>
    <circle r="3" fill="var(--rh-paper-ink)"/>
  </g>
  <g stroke="var(--rh-paper-ink)" stroke-width="1" fill="none" opacity="0.55">
    <path d="M100 50 l-8 -4 l8 -4 M100 50 l8 -4 l-8 -4" transform="translate(-40 190)"/>
    <path d="M100 50 l-8 -4 l8 -4 M100 50 l8 -4 l-8 -4" transform="translate(-20 110)"/>
  </g>
</svg>`;

export const JAR_SVG = `
<svg viewBox="0 0 60 80" focusable="false">
  <rect x="14" y="4" width="32" height="12" rx="3" fill="var(--sepia-light)"/>
  <path d="M10 16 L50 16 L52 70 Q52 78 44 78 L16 78 Q8 78 8 70 Z" fill="var(--rh-marmalade)" opacity="0.92"/>
  <path d="M14 22 L18 22 L18 66 L14 66 Z" fill="var(--world-glow)" opacity="0.5"/>
  <rect x="14" y="34" width="32" height="20" rx="2" fill="var(--paper-base)"/>
  <path d="M19 40 H41 M19 45 H37 M19 50 H33" stroke="var(--ink-secondary)" stroke-width="2" stroke-linecap="round"/>
</svg>`;

/** A thing off a shelf, in her hand: a book of the colour it was, a jar, or a map. */
export const heldSvg = (kind: 'book' | 'jar' | 'map', color = 'var(--rh-book-1)'): string => {
  if (kind === 'jar') {
    return JAR_SVG;
  }
  if (kind === 'map') {
    return `
<svg viewBox="0 0 80 60" focusable="false">
  <rect x="2" y="2" width="76" height="56" rx="3" fill="var(--rh-paper)" stroke="var(--rh-paper-frame)" stroke-width="3"/>
  <path d="M10 44 C22 30 30 38 40 24 C50 12 60 30 70 18" stroke="var(--rh-paper-ink)" stroke-width="2.5" fill="none"/>
  <path d="M14 14 l8 8 M22 14 l-8 8" stroke="var(--wonder-red-faded)" stroke-width="2"/>
  <circle cx="60" cy="42" r="6" fill="none" stroke="var(--rh-paper-ink)" stroke-width="2"/>
</svg>`;
  }
  return `
<svg viewBox="0 0 60 80" focusable="false">
  <rect x="6" y="4" width="48" height="72" rx="3" fill="${color}"/>
  <rect x="12" y="4" width="4" height="72" fill="oklch(from var(--ink-primary) l c h / 0.25)"/>
  <rect x="50" y="8" width="6" height="64" fill="var(--paper-base)"/>
  <path d="M22 24 h20 M22 32 h16" stroke="var(--paper-base)" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;
};
